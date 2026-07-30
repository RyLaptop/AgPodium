import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { EditProfileForm } from "./_edit-profile";
import { UserAvatar } from "@/components/user-avatar";
import { MessageButton } from "./_message-button";
import { DeleteAccountButton } from "./_delete-account";
import { ChangeUniversitySection } from "./_change-university";
import type { University } from "@/lib/university";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const jar = await cookies();
  const currentUni = (jar.get("uni")?.value ?? "tamu") as University;
  const windowStartStr = jar.get("uni_switch_window_start")?.value;
  const countStr = jar.get("uni_switch_count")?.value;
  const windowStart = windowStartStr ? new Date(windowStartStr) : null;
  const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
  const inWindow = windowStart ? Date.now() - windowStart.getTime() < WINDOW_MS : false;
  const switchesUsed = inWindow ? parseInt(countStr ?? "0", 10) : 0;
  const switchesRemaining = Math.max(0, 2 - switchesUsed);
  const windowReset = inWindow && windowStart ? new Date(windowStart.getTime() + WINDOW_MS) : null;

  const supabase = await createClient();
  const svc = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: memberships }, { data: recentSpeaks }, { data: dmThread }] =
    await Promise.all([
      svc
        .from("users")
        .select("id, full_name, email, bio, major, avatar_url, created_at, is_site_admin")
        .eq("id", userId)
        .single(),
      svc
        .from("org_members")
        .select("role, orgs(id, slug, name)")
        .eq("user_id", userId)
        .eq("status", "active"),
      svc
        .from("speak_requests")
        .select("id, meetings(title, starts_at, orgs(name))")
        .eq("requester_user_id", userId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(5),
      user
        ? svc
            .from("dm_threads")
            .select("id, status")
            .or(`and(user_a.eq.${user.id},user_b.eq.${userId}),and(user_a.eq.${userId},user_b.eq.${user.id})`)
            .maybeSingle()
        : { data: null },
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
        {!isSelf && (
          <div className="mt-4">
            <MessageButton
              targetUserId={userId}
              existingThreadId={dmThread?.id ?? null}
              existingStatus={(dmThread?.status as "pending" | "accepted" | "declined" | null) ?? null}
            />
          </div>
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
                            ? "bg-brand/10 text-brand-dark font-medium"
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

      {isSelf && (
        <ChangeUniversitySection
          currentUni={currentUni}
          isAdmin={(profile as unknown as { is_site_admin?: boolean })?.is_site_admin ?? false}
          switchesRemaining={switchesRemaining}
          windowReset={windowReset}
        />
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Member since {new Date(profile.created_at).toLocaleDateString()}
        </p>
        {isSelf && <DeleteAccountButton />}
      </div>
    </div>
  );
}
