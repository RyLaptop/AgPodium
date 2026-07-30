import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { EditBulletinForm } from "./_form";

export const dynamic = "force-dynamic";

export default async function EditBulletinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();
  const [{ data: post }, { data: profile }, { data: memberships }] = await Promise.all([
    svc
      .from("bulletin_posts")
      .select("id, submitter_id, org_id, event_title, event_description, event_at, event_location, thumbnail_url, banner_url, website_url, instagram_url, is_university_post, orgs(id, name)")
      .eq("id", id)
      .single(),
    supabase.from("users").select("is_site_admin").eq("id", user.id).single(),
    supabase
      .from("org_members")
      .select("orgs(id, name)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .in("role", ["officer", "director"]),
  ]);

  if (!post) notFound();

  const isAdmin = profile?.is_site_admin ?? false;

  // Auth check
  const isSubmitter = post.submitter_id === user.id;
  let isOrgStaff = false;
  if (post.org_id) {
    const { data: mem } = await supabase.from("org_members").select("role")
      .eq("org_id", post.org_id).eq("user_id", user.id).eq("status", "active").maybeSingle();
    isOrgStaff = mem?.role === "director";
  }

  if (!isAdmin && !isSubmitter && !isOrgStaff) notFound();

  const myOrgs = (memberships ?? []).map((m) => m.orgs as unknown as { id: string; name: string } | null).filter(Boolean) as { id: string; name: string }[];

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <a href={`/bulletin/${id}`} className="text-sm text-brand hover:underline">← Back to event</a>
        <h1 className="text-3xl font-bold mt-2">Edit event</h1>
      </div>
      <EditBulletinForm
        post={{
          id: post.id,
          event_title: post.event_title,
          event_description: post.event_description ?? "",
          event_at: post.event_at,
          event_location: post.event_location ?? "",
          thumbnail_url: (post as unknown as { thumbnail_url: string | null }).thumbnail_url ?? null,
          banner_url: (post as unknown as { banner_url: string | null }).banner_url ?? null,
          website_url: (post as unknown as { website_url: string | null }).website_url ?? "",
          instagram_url: (post as unknown as { instagram_url: string | null }).instagram_url ?? "",
          org_id: (post as unknown as { is_university_post: boolean }).is_university_post ? "__university__" : (post.org_id ?? ""),
        }}
        myOrgs={myOrgs}
        isAdmin={isAdmin}
      />
    </div>
  );
}
