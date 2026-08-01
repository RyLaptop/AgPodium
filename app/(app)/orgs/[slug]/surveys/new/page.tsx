import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { SurveyBuilder } from "./_builder";

export const dynamic = "force-dynamic";

export default async function NewSurveyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();
  const { data: org } = await svc.from("orgs").select("id, name, slug, status").eq("slug", slug).single();
  if (!org || org.status !== "approved") notFound();

  const [{ data: myMembership }, { data: profile }] = await Promise.all([
    supabase.from("org_members").select("role, status").eq("org_id", org.id).eq("user_id", user.id).maybeSingle(),
    supabase.from("users").select("is_site_admin").eq("id", user.id).single(),
  ]);
  const isAdmin = profile?.is_site_admin ?? false;
  if (!isAdmin && (myMembership?.status !== "active" || !["director", "officer"].includes(myMembership.role))) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href={`/orgs/${slug}/surveys`} className="text-sm text-brand hover:underline">← Surveys</Link>
        <h1 className="text-2xl font-bold mt-1">New survey</h1>
      </div>
      <SurveyBuilder orgId={org.id} orgSlug={org.slug} />
    </div>
  );
}
