import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Post = {
  id: string;
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

  const { data: posts } = await supabase
    .from("bulletin_posts")
    .select("id, event_title, event_description, event_at, event_location, orgs(name, slug)")
    .eq("status", "approved")
    .gte("event_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("event_at", { ascending: true });

  const { data: profile } = user
    ? await supabase
        .from("users")
        .select("is_site_admin")
        .eq("id", user.id)
        .single()
    : { data: null };

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
          {profile?.is_site_admin && (
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
          Submitted. It'll show up here once a site admin approves it.
        </p>
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
                {items.map((p) => (
                  <li
                    key={p.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{p.event_title}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(p.event_at).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {p.event_description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {p.event_description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {p.orgs?.name ? `${p.orgs.name} · ` : ""}
                      {p.event_location ?? "Location TBD"}
                    </p>
                  </li>
                ))}
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
