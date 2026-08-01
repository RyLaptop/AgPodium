import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ReportForm } from "./_form";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const svc = createServiceClient();
  const { data: org } = await svc.from("orgs").select("id, name, slug, status").eq("slug", slug).single();
  if (!org || org.status !== "approved") notFound();

  const [myMembershipResult, profileResult] = await Promise.all([
    user ? supabase.from("org_members").select("role, status").eq("org_id", org.id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    user ? supabase.from("users").select("is_site_admin").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);
  const myMembership = myMembershipResult.data;
  const isAdmin = (profileResult.data as { is_site_admin?: boolean } | null)?.is_site_admin ?? false;

  const isStaff = isAdmin || (myMembership?.status === "active" &&
    (myMembership.role === "director" || myMembership.role === "officer"));

  let reports: { id: string; content: string; created_at: string }[] = [];
  if (isStaff) {
    const { data } = await svc.from("incident_reports").select("id, content, created_at")
      .eq("org_id", org.id).order("created_at", { ascending: false });
    reports = data ?? [];
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link href={`/orgs/${slug}`} className="text-sm text-brand hover:underline">← Back to org</Link>
        <h1 className="text-2xl font-bold mt-1">Anonymous Report</h1>
        <p className="text-sm text-gray-500 mt-1">
          Reports are completely anonymous — no name or account information is stored.
        </p>
      </div>

      <ReportForm orgId={org.id} />

      {isStaff && (
        <div className="space-y-4 border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold">Submitted Reports ({reports.length})</h2>
          {reports.length === 0 ? (
            <p className="text-sm text-gray-500">No reports submitted yet.</p>
          ) : (
            <ul className="space-y-3">
              {reports.map((r) => (
                <li key={r.id} className="border border-gray-200 rounded-xl p-4 space-y-1.5">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.content}</p>
                  <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
