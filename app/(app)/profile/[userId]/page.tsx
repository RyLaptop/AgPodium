import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditProfileForm } from "./_edit-profile";
import { UserAvatar } from "@/components/user-avatar";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: memberships }, { data: recentSpeaks }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, full_name, email, bio, major, avatar_url, created_at")
        .eq("id", userId)
        .single(),
      supabase
        .from("org_members")
        .select("role, orgs(id, slug, name)")
        .eq("user_id", userId)
        .eq("status", "active"),
      supabase
        .from("speak_requests")
        .select("id, meetings(title, starts_at, orgs(name))")
        .eq("requester_user_id", userId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  if (!profile) notFound();

  const isSelf = user?.id === userId;
  const displayName = profile.full_name ?? profile.email.split("@")[0];

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <div className="flex items-center gap-4">
          <UserAvatar avatarUrl={profile.avatar_url} name={displayName} size="lg" />
          <div>
            <h1 className="text-3xl font-bold">{displayName}</h1>
            {profile.major && (
              <p className="text-gray-500 mt-1">{profile.major}</p>
            )}
          </div>
        </div>
        {profile.bio && (
          <p className="text-gray-700 mt-4 max-w-xl">{profile.bio}</p>
        )}
        {!profile.bio && !profile.major && isSelf && (
          <p className="text-gray-400 mt-2 text-sm italic">Add your major and a bio so others know who you are.</p>
        )}
        {isSelf && (
          <div className="mt-4">
            <EditProfileForm
              currentName={profile.full_name}
              currentBio={profile.bio ?? null}
              currentMajor={profile.major ?? null}
              currentAvatarUrl={profile.avatar_url ?? null}
            />
          </div>
        )}
      </div>

      {memberships && memberships.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Orgs</h2>
          <ul className="flex flex-wrap gap-2">
            {memberships.map((m) => {
              const org = m.orgs as unknown as { id: string; slug: string; name: string };
              const roleLabel =
                m.role === "director" ? "STAFF" : m.role === "officer" ? "Officer" : null;
              return (
                <li key={org.id}>
                  <Link
                    href={`/orgs/${org.slug}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg hover:border-brand text-sm transition"
                  >
                    {org.name}
                    {roleLabel && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          m.role === "director"
                            ? "bg-maroon-100 text-maroon-700 font-medium"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {roleLabel}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {recentSpeaks && recentSpeaks.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Recent appearances</h2>
          <ul className="space-y-2">
            {recentSpeaks.map((s) => {
              const m = s.meetings as unknown as {
                title: string;
                starts_at: string;
                orgs: { name: string };
              } | null;
              if (!m) return null;
              return (
                <li key={s.id} className="border border-gray-200 rounded-lg px-4 py-3">
                  <p className="font-medium text-sm">{m.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {m.orgs.name} · {new Date(m.starts_at).toLocaleDateString()}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="text-xs text-gray-400">
        Member since {new Date(profile.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
