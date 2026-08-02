import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { BulletinCarousel } from "./_bulletin-carousel";
import { getUniversity, UNIVERSITIES } from "@/lib/university";
import { AdBanner } from "@/components/ad-banner";
import { SiteFeedbackWidget } from "../_site-feedback";

export default async function DashboardPage() {
  const uni = await getUniversity();
  const uniInfo = UNIVERSITIES[uni];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const svc = createServiceClient();

  const [{ data: memberships }, { data: bulletinPosts }, { data: featuredOrg }] = await Promise.all([
    user
      ? supabase
          .from("org_members")
          .select("role, orgs!inner(id, slug, name, description, university)")
          .eq("user_id", user.id)
          .eq("orgs.university", uni)
      : Promise.resolve({ data: [] }),
    svc
      .from("bulletin_posts")
      .select("id, event_title, event_description, event_at, event_location, thumbnail_url, is_university_post, orgs(name)")
      .eq("status", "approved")
      .eq("university", uni)
      .gte("event_at", new Date().toISOString())
      .order("event_at", { ascending: true })
      .limit(10),
    svc
      .from("orgs")
      .select("id, slug, name, description, logo_url")
      .eq("is_featured", true)
      .eq("university", uni)
      .maybeSingle(),
  ]);

  const orgCount = memberships?.length ?? 0;

  const carouselPosts = (bulletinPosts ?? []).map((p) => ({
    id: p.id,
    event_title: p.event_title,
    event_description: p.event_description ?? null,
    event_at: p.event_at,
    event_location: p.event_location ?? null,
    thumbnail_url: (p as unknown as { thumbnail_url: string | null }).thumbnail_url ?? null,
    is_university_post: (p as unknown as { is_university_post: boolean }).is_university_post ?? false,
    org_name: (p.orgs as unknown as { name: string } | null)?.name ?? null,
  }));

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold">{user ? "Welcome back." : `Welcome to UniPodium · ${uniInfo.shortName}.`}</h1>
        <p className="text-gray-600 mt-1">
          {user ? `Signed in as ${user.email}.` : "Browse orgs, find meetings, and request speaking slots."}
        </p>
      </section>

      {featuredOrg && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand mb-2">⭐ Featured org this week</p>
          <Link
            href={`/orgs/${(featuredOrg as unknown as { slug: string }).slug}`}
            className="block border-2 border-brand/30 rounded-xl p-4 hover:border-brand hover:shadow transition"
          >
            <div className="flex items-start gap-3">
              {(featuredOrg as unknown as { logo_url?: string | null }).logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(featuredOrg as unknown as { logo_url: string }).logo_url}
                  alt={(featuredOrg as unknown as { name: string }).name}
                  className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0"
                />
              )}
              <div>
                <h3 className="font-bold text-lg">{(featuredOrg as unknown as { name: string }).name}</h3>
                {(featuredOrg as unknown as { description?: string | null }).description && (
                  <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                    {(featuredOrg as unknown as { description: string }).description}
                  </p>
                )}
              </div>
            </div>
          </Link>
        </section>
      )}

      {carouselPosts.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-2">📢 Upcoming bulletin events</h2>
          <BulletinCarousel posts={carouselPosts} uniLabel={uniInfo.label} />
        </section>
      )}

      <AdBanner variant="apartment" />

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
              <Link href="/login?mode=signup" className="text-brand hover:underline">Create account</Link>
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
                        {m.role === "director" ? "Director" : m.role === "officer" ? "Staff" : "Member"}
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
      <SiteFeedbackWidget />

      <p className="text-xs text-gray-400 text-center pt-4 border-t border-gray-100">
        UniPodium is a student-run platform and is not affiliated with, endorsed by, or associated with {uniInfo.name} in any way.
      </p>
    </div>
  );
}
