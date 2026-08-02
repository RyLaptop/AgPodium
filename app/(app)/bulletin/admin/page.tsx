import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ReviewQueue } from "./_review-queue";
import { OrgApprovalQueue } from "./_org-approval";
import { UserList } from "./_user-list";
import { PendingUsers } from "./_pending-users";
import { TestEmailButton } from "./_test-email";
import { FeaturedOrgPicker } from "./_featured-org";
import { AdAnalytics } from "./_ad-analytics";
import { UserAnalytics } from "./_user-analytics";
import { getUniversity, UNIVERSITIES } from "@/lib/university";

export const dynamic = "force-dynamic";

export default async function BulletinAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("is_site_admin").eq("id", user.id).single();

  if (!profile?.is_site_admin) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold">Not authorized</h1>
        <p className="text-gray-600 mt-2 text-sm">
          Site admin only. Ask Rylan to flip your{" "}
          <code className="text-xs bg-gray-100 px-1 rounded">is_site_admin</code> flag.
        </p>
      </div>
    );
  }

  const { scope = "campus" } = await searchParams;
  const isCampus = scope !== "site";
  const uni = await getUniversity();
  const uniInfo = UNIVERSITIES[uni];
  const admin = createServiceClient();

  const userSelect = "id, email, full_name, avatar_url, is_site_admin, is_verified, created_at";

  const [
    { data: pendingPosts },
    { data: pendingOrgs },
    { data: allUsers },
    { data: pendingAccounts },
    { data: approvedOrgs },
    { data: adClicks },
    authUsersResult,
  ] = await Promise.all([
    admin.from("bulletin_posts")
      .select("id, event_title, event_description, event_at, event_location, created_at, users!bulletin_posts_submitter_id_fkey(full_name, email), orgs(name)")
      .eq("status", "pending")
      .eq("university", uni)
      .order("created_at", { ascending: true }),
    admin.from("orgs")
      .select("id, name, slug, description, tags, created_at, org_members(user_id, role, users(full_name, email))")
      .eq("status", "pending")
      .eq("university", uni)
      .order("created_at", { ascending: true }),
    isCampus
      ? admin.from("users").select(userSelect).eq("university", uni).order("created_at", { ascending: false })
      : admin.from("users").select(userSelect).order("created_at", { ascending: false }),
    isCampus
      ? admin.from("users").select("id, email, full_name, created_at").eq("is_verified", false).eq("is_site_admin", false).eq("university", uni).order("created_at", { ascending: true })
      : admin.from("users").select("id, email, full_name, created_at").eq("is_verified", false).eq("is_site_admin", false).order("created_at", { ascending: true }),
    isCampus
      ? admin.from("orgs").select("id, name, is_featured").eq("status", "approved").eq("university", uni).order("name")
      : admin.from("orgs").select("id, name, is_featured").eq("status", "approved").order("name"),
    admin.from("ad_clicks").select("tier, variant"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const lastSignInMap = new Map(
    (authUsersResult.data?.users ?? []).map((u) => [u.id, u.last_sign_in_at ?? null])
  );

  const pendingOrgsList = (pendingOrgs ?? []).map((o) => {
    const members = o.org_members as unknown as { user_id: string; role: string; users: { full_name: string | null; email: string } }[];
    const founder = members.find((m) => m.role === "director");
    return {
      id: o.id,
      name: o.name,
      slug: o.slug,
      description: o.description,
      tags: (o.tags as unknown as string[]) ?? [],
      created_at: o.created_at,
      founder_name: founder?.users?.full_name ?? null,
      founder_email: founder?.users?.email ?? "",
    };
  });

  const usersList = (allUsers ?? []).map((u) => ({
    ...u,
    last_sign_in_at: lastSignInMap.get(u.id) ?? null,
  })) as {
    id: string; email: string; full_name: string | null; avatar_url: string | null; is_site_admin: boolean; is_verified: boolean; created_at: string; last_sign_in_at: string | null;
  }[];

  const pendingAccountsList = (pendingAccounts ?? []) as {
    id: string; email: string; full_name: string | null; created_at: string;
  }[];

  const approvedOrgsList = (approvedOrgs ?? []) as { id: string; name: string; is_featured: boolean }[];
  const featuredOrgId = approvedOrgsList.find((o) => o.is_featured)?.id ?? null;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Admin</h1>
          <div className="flex items-center gap-1 mt-2 text-sm">
            <Link
              href="?scope=campus"
              className={`px-3 py-1 rounded-full border transition ${isCampus ? "bg-brand text-white border-brand" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
            >
              {uniInfo.label}
            </Link>
            <Link
              href="?scope=site"
              className={`px-3 py-1 rounded-full border transition ${!isCampus ? "bg-brand text-white border-brand" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
            >
              Site-wide
            </Link>
          </div>
        </div>
        <TestEmailButton />
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-3">User analytics</h2>
        <UserAnalytics users={usersList.map((u) => ({ created_at: u.created_at, last_sign_in_at: u.last_sign_in_at }))} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Ad analytics</h2>
        <AdAnalytics clicks={adClicks ?? []} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Featured org of the week</h2>
        <FeaturedOrgPicker
          currentFeaturedId={featuredOrgId}
          orgs={approvedOrgsList.map((o) => ({ id: o.id, name: o.name }))}
        />
      </section>

      {pendingAccountsList.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Pending account approvals ({pendingAccountsList.length})</h2>
          <PendingUsers users={pendingAccountsList} />
        </section>
      )}

      {pendingOrgsList.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Pending org requests ({pendingOrgsList.length})</h2>
          <OrgApprovalQueue orgs={pendingOrgsList} />
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-3">Bulletin review queue</h2>
        <ReviewQueue posts={pendingPosts ?? []} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">All users ({usersList.length})</h2>
        <UserList users={usersList} />
      </section>
    </div>
  );
}
