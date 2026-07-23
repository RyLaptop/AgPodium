import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ClearBulletinPost } from "./_clear-post";
import { PostActions } from "./_post-actions";

export const dynamic = "force-dynamic";

type Post = {
  id: string;
  submitter_id: string;
  org_id: string | null;
  event_title: string;
  event_description: string | null;
  event_at: string;
  event_location: string | null;
  orgs: { name: string; slug: string } | null;
};

export default async function BulletinPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: posts }, { data: profile }, { data: myPosts }, { data: staffMemberships }] =
    await Promise.all([
      supabase
        .from("bulletin_posts")
        .select("id, submitter_id, org_id, event_title, event_description, event_at, event_location, orgs(name, slug)")
        .eq("status", "approved")
        .gte("event_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("event_at", { ascending: true }),
      user
        ? supabase.from("users").select("is_site_admin").eq("id", user.id).single()
        : Promise.resolve({ data: null }),
      user
        ? supabase
            .from("bulletin_posts")
            .select("id, event_title, event_at, status")
            .eq("submitter_id", user.id)
            .in("status", ["pending", "denied"])
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: null }),
      user
        ? supabase
            .from("org_members")
            .select("org_id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .eq("role", "director")
        : Promise.resolve({ data: null }),
    ]);

  const isAdmin = profile?.is_site_admin ?? false;
  const staffOrgIds = new Set((staffMemberships ?? []).map((m) => m.org_id as string));

  const canManagePost = (post: Post) => {
    if (!user) return false;
    if (isAdmin) return true;
    if (post.submitter_id === user.id) return true;
    if (post.org_id && staffOrgIds.has(post.org_id)) return true;
    return false;
  };

  const grouped = groupByDate((posts as unknown as Post[]) ?? []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulletin board</h1>
          <p className="text-gray-600 mt-1">
            Big campus events, curated by site admins.
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link
              href="/bulletin/admin"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Review queue
            </Link>
          )}
          <Link
            href="/bulletin/submit"
            className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark text-sm"
          >
            + Submit event
          </Link>
        </div>
      </div>

      {submitted && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Submitted! It'll show up here once a site admin approves it.
        </p>
      )}

      {myPosts && myPosts.length > 0 && (
        <section className="border border-gray-200 rounded-lg p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">My pending / denied submissions</h2>
          <ul className="space-y-1">
            {myPosts.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm gap-2">
                <span className="text-gray-800 flex-1 min-w-0 truncate">{p.event_title}</span>
                <div className="flex items-center gap-2 shrink-0 text-xs text-gray-500">
                  <span>{new Date(p.event_at).toLocaleDateString()}</span>
                  <span
                    className={`px-2 py-0.5 rounded ${
                      p.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {p.status}
                  </span>
                  {p.status === "denied" && <ClearBulletinPost id={p.id} />}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {grouped.length === 0 ? (
        <p className="text-gray-500 text-sm">No upcoming events yet.</p>
      ) : (
        <div className="space-y-8">
          {grouped.map(([dateLabel, items]) => (
            <section key={dateLabel}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {dateLabel}
              </h2>
              <ul className="space-y-2">
                {items.map((p) => {
                  const manageable = canManagePost(p);
                  return (
                    <li
                      key={p.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{p.event_title}</p>
                          {p.event_description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {p.event_description}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {p.orgs?.name ? `${p.orgs.name} · ` : ""}
                            {p.event_location ?? "Location TBD"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-500">
                            {new Date(p.event_at).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                          {manageable && (
                            <PostActions
                              postId={p.id}
                              title={p.event_title}
                              description={p.event_description}
                              eventAt={p.event_at}
                              location={p.event_location}
                            />
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function groupByDate(posts: Post[]): [string, Post[]][] {
  const map = new Map<string, Post[]>();
  for (const p of posts) {
    const label = new Date(p.event_at).toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(p);
  }
  return Array.from(map.entries());
}
