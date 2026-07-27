import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ReviewQueue } from "./_review-queue";
import { OrgApprovalQueue } from "./_org-approval";
import { UserList } from "./_user-list";
import { TestEmailButton } from "./_test-email";

export const dynamic = "force-dynamic";

export default async function BulletinAdminPage() {
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

  const admin = createServiceClient();
  const [{ data: pendingPosts }, { data: pendingOrgs }, { data: allUsers }] = await Promise.all([
    admin.from("bulletin_posts")
      .select("id, event_title, event_description, event_at, event_location, created_at, users!bulletin_posts_submitter_id_fkey(full_name, email), orgs(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    admin.from("orgs")
      .select("id, name, slug, description, tags, created_at, org_members(user_id, role, users(full_name, email))")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    admin.from("users")
      .select("id, email, full_name, avatar_url, is_site_admin, created_at")
      .order("created_at", { ascending: false }),
  ]);

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

  const usersList = (allUsers ?? []) as {
    id: string; email: string; full_name: string | null; avatar_url: string | null; is_site_admin: boolean; created_at: string;
  }[];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">Admin</h1>
        <TestEmailButton />
      </div>

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
