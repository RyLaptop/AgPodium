import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { BulletinCarousel } from "./_bulletin-carousel";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const svc = createServiceClient();

  const [{ data: memberships }, { data: bulletinPosts }] = await Promise.all([
    user
      ? supabase
          .from("org_members")
          .select("role, orgs(id, slug, name, description)")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
    svc
      .from("bulletin_posts")
      .select("id, event_title, event_description, event_at, event_location, orgs(name)")
      .eq("status", "approved")
      .gte("event_at", new Date().toISOString())
      .order("event_at", { ascending: true })
      .limit(10),
  ]);

  const orgCount = memberships?.length ?? 0;

  const carouselPosts = (bulletinPosts ?? []).map((p) => ({
    id: p.id,
    event_title: p.event_title,
    event_description: p.event_description ?? null,
    event_at: p.event_at,
    event_location: p.event_location ?? null,
    org_name: (p.orgs as { name: string } | null)?.name ?? null,
  }));

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold">{user ? "Welcome back." : "Welcome to AgPodium."}</h1>
        <p className="text-gray-600 mt-1">
          {user ? `Signed in as ${user.email}.` : "Browse orgs, find meetings, and request speaking slots."}
        </p>
      </section>

      {carouselPosts.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-2">📢 Upcoming bulletin events</h2>
          <BulletinCarousel posts={carouselPosts} />
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your orgs</h2>
          <Link
            href="/orgs/new"
            className="text-sm text-brand hover:underline"
          >
            + Create org
          </Link>
        </div>

        {!user ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center space-y-3">
            <p className="text-gray-600">Sign in to see your orgs and track your requests.</p>
            <div className="flex gap-3 justify-center text-sm">
              <Link href="/login" className="text-brand hover:underline">Sign in</Link>
              <span className="text-gray-400">·</span>
              <Link href="/signup" className="text-brand hover:underline">Create account</Link>
            </div>
          </div>
        ) : orgCount === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center space-y-2">
            <p className="text-gray-600">You&apos;re not in any orgs yet.</p>
            <div className="flex gap-3 justify-center text-sm">
              <Link href="/orgs" className="text-brand hover:underline">
                Browse orgs
              </Link>
              <span className="text-gray-400">·</span>
              <Link href="/orgs/new" className="text-brand hover:underline">
                Create one
              </Link>
            </div>
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-4">
            {memberships?.map((m) => {
              const org = m.orgs as unknown as {
                id: string;
                slug: string;
                name: string;
                description: string | null;
              };
              return (
                <li key={org.id}>
                  <Link
                    href={`/orgs/${org.slug}`}
                    className="block border border-gray-200 rounded-lg p-4 hover:border-brand hover:shadow transition"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{org.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        m.role === "director"
                          ? "bg-brand/10 text-brand-dark"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {m.role === "director" ? "STAFF" : m.role === "officer" ? "Officer" : "Member"}
                      </span>
                    </div>
                    {org.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {org.description}
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        <Link
          href="/orgs"
          className="border border-gray-200 rounded-lg p-4 hover:border-brand hover:shadow transition"
        >
          <h3 className="font-semibold">Browse orgs</h3>
          <p className="text-sm text-gray-500 mt-1">
            Find meetings to speak at
          </p>
        </Link>
        <Link
          href="/requests"
          className="border border-gray-200 rounded-lg p-4 hover:border-brand hover:shadow transition"
        >
          <h3 className="font-semibold">Requests</h3>
          <p className="text-sm text-gray-500 mt-1">
            Track your requests and review incoming
          </p>
        </Link>
        <Link
          href="/map"
          className="border border-gray-200 rounded-lg p-4 hover:border-brand hover:shadow transition"
        >
          <h3 className="font-semibold">Campus map</h3>
          <p className="text-sm text-gray-500 mt-1">Meetings near you</p>
        </Link>
      </section>
      <p className="text-xs text-gray-400 text-center pt-4 border-t border-gray-100">
        AgPodium is a student-run platform and is not affiliated with, endorsed by, or associated with Texas A&amp;M University in any way.
      </p>
    </div>
  );
}
