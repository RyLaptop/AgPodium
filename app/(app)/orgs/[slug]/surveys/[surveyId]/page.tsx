import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ResponseForm } from "./_response-form";

export const dynamic = "force-dynamic";

export default async function SurveyPage({ params }: { params: Promise<{ slug: string; surveyId: string }> }) {
  const { slug, surveyId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const svc = createServiceClient();
  const { data: org } = await svc.from("orgs").select("id, name, slug, status").eq("slug", slug).single();
  if (!org || org.status !== "approved") notFound();

  const { data: survey } = await svc.from("org_surveys").select("id, title, description, is_public, org_id").eq("id", surveyId).single();
  if (!survey || survey.org_id !== org.id) notFound();

  const [myMembershipResult, profileResult] = await Promise.all([
    user ? supabase.from("org_members").select("role, status").eq("org_id", org.id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    user ? supabase.from("users").select("is_site_admin").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);
  const myMembership = myMembershipResult.data;
  const isAdmin = (profileResult.data as { is_site_admin?: boolean } | null)?.is_site_admin ?? false;

  const isMember = myMembership?.status === "active";
  const isStaff = isAdmin || (isMember && (myMembership?.role === "director" || myMembership?.role === "officer"));
  if (!survey.is_public && !isMember && !isAdmin) notFound();

  const { data: questions } = await svc.from("survey_questions").select("id, question_text, question_type, options").eq("survey_id", surveyId).order("sort_order");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href={`/orgs/${slug}/surveys`} className="text-sm text-brand hover:underline">← Surveys</Link>
        <div className="flex items-start justify-between gap-3 mt-1">
          <div>
            <h1 className="text-2xl font-bold">{survey.title}</h1>
            {survey.description && <p className="text-gray-500 text-sm mt-1">{survey.description}</p>}
          </div>
          {isStaff && (
            <Link href={`/orgs/${slug}/surveys/${surveyId}/results`} className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 shrink-0">
              View results
            </Link>
          )}
        </div>
      </div>

      <ResponseForm
        surveyId={surveyId}
        orgSlug={org.slug}
        questions={(questions ?? []).map((q) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options as string[] | null,
        }))}
      />
    </div>
  );
}
