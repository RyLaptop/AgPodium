import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { AwardsManager } from "./_manager";

export const dynamic = "force-dynamic";

export default async function AwardsPage({ params }: { params: Promise<{ slug: string }> }) {
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
  if (myMembership?.status !== "active" && !isAdmin) notFound();

  const isStaff = isAdmin || myMembership?.role === "director" || myMembership?.role === "officer";

  const [{ data: awardRows }, { data: memberAwardRows }, { data: memberRows }] = await Promise.all([
    svc.from("org_awards").select("id, name, description, created_at").eq("org_id", org.id).order("created_at"),
    svc.from("member_awards").select("id, award_id, user_id, note, awarded_at, users(full_name, email)").eq("org_id", org.id).order("awarded_at", { ascending: false }),
    svc.from("org_members").select("user_id, users(id, full_name, email)").eq("org_id", org.id).eq("status", "active"),
  ]);

  const awards = (awardRows ?? []).map((a) => ({
    id: a.id, name: a.name, description: a.description as string | null, created_at: a.created_at,
  }));

  const memberAwards = (memberAwardRows ?? []).map((ma) => {
    const u = ma.users as unknown as { full_name: string | null; email: string };
    return {
      id: ma.id,
      award_id: ma.award_id as string,
      user_id: ma.user_id as string,
      note: ma.note as string | null,
      awarded_at: ma.awarded_at as string,
      recipient_name: u.full_name ?? u.email.split("@")[0],
    };
  });

  const members = (memberRows ?? []).map((m) => {
    const u = m.users as unknown as { id: string; full_name: string | null; email: string };
    return { user_id: m.user_id as string, full_name: u.full_name, email: u.email };
  });

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link href={`/orgs/${slug}`} className="text-sm text-brand hover:underline">← Back to org</Link>
        <h1 className="text-2xl font-bold mt-1">Awards</h1>
      </div>
      <AwardsManager
        orgId={org.id}
        orgSlug={org.slug}
        isStaff={isStaff}
        awards={awards}
        memberAwards={memberAwards}
        members={members}
      />
    </div>
  );
}
