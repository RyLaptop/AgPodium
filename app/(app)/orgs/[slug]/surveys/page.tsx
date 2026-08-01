import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { DeleteSurveyButton } from "./_delete-survey";

export const dynamic = "force-dynamic";

export default async function SurveysPage({ params }: { params: Promise<{ slug: string }> }) {
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

  const isMember = myMembership?.status === "active";
  const isStaff = isAdmin || (isMember && (myMembership?.role === "director" || myMembership?.role === "officer"));

  const { data: surveys } = await (isMember || isAdmin
    ? supabase.from("org_surveys").select("id, title, description, is_public, created_at").eq("org_id", org.id).order("created_at", { ascending: false })
    : svc.from("org_surveys").select("id, title, description, is_public, created_at").eq("org_id", org.id).eq("is_public", true).order("created_at", { ascending: false })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href={`/orgs/${slug}`} className="text-sm text-brand hover:underline">← Back to {org.name}</Link>
          <h1 className="text-2xl font-bold mt-1">Surveys</h1>
        </div>
        {isStaff && (
          <Link href={`/orgs/${slug}/surveys/new`} className="px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark">
            + New survey
          </Link>
        )}
      </div>

      {(!surveys || surveys.length === 0) ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center text-gray-500">
          <p>No surveys yet.{isStaff && " Staff can create one above."}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {surveys.map((s) => (
            <li key={s.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/orgs/${slug}/surveys/${s.id}`} className="font-semibold hover:text-brand hover:underline">
                    {s.title}
                  </Link>
                  {s.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{s.description}</p>}
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${s.is_public ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {s.is_public ? "Public" : "Members only"}
                    </span>
                  </div>
                </div>
                {isStaff && (
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/orgs/${slug}/surveys/${s.id}/results`} className="text-xs px-2.5 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Results
                    </Link>
                    <DeleteSurveyButton surveyId={s.id} orgId={org.id} orgSlug={org.slug} />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
