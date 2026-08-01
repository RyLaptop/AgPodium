import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ChecklistManager } from "./_manager";

export const dynamic = "force-dynamic";

export default async function ChecklistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();
  const { data: org } = await svc.from("orgs").select("id, name, slug, status").eq("slug", slug).single();
  if (!org || org.status !== "approved") notFound();

  const { data: myMembership } = await supabase.from("org_members").select("role, status").eq("org_id", org.id).eq("user_id", user.id).maybeSingle();
  if (myMembership?.status !== "active") notFound();

  const isStaff = myMembership.role === "director" || myMembership.role === "officer";

  const { data: checklist } = await svc.from("onboarding_checklists").select("id").eq("org_id", org.id).maybeSingle();

  let items: { id: string; label: string; sort_order: number }[] = [];
  if (checklist) {
    const { data: itemRows } = await svc.from("onboarding_items").select("id, label, sort_order").eq("checklist_id", checklist.id).order("sort_order");
    items = itemRows ?? [];
  }

  let members: { user_id: string; full_name: string | null; email: string }[] = [];
  if (isStaff) {
    const { data: memberRows } = await svc.from("org_members").select("user_id, users(id, full_name, email)").eq("org_id", org.id).eq("status", "active");
    members = (memberRows ?? []).map((m) => {
      const u = m.users as unknown as { id: string; full_name: string | null; email: string };
      return { user_id: m.user_id as string, full_name: u.full_name, email: u.email };
    });
  }

  const { data: completions } = await svc.from("member_checklist_completions").select("user_id, item_id").eq("org_id", org.id);
  const completionSet = (completions ?? []).map((c) => `${c.user_id}:${c.item_id}`);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <Link href={`/orgs/${slug}`} className="text-sm text-brand hover:underline">← Back to org</Link>
        <h1 className="text-2xl font-bold mt-1">Onboarding Checklist</h1>
      </div>
      <ChecklistManager
        orgId={org.id}
        orgSlug={org.slug}
        isStaff={isStaff}
        items={items}
        members={members}
        completionSet={completionSet}
        currentUserId={user.id}
      />
    </div>
  );
}
