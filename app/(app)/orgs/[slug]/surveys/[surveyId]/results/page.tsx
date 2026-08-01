import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export default async function SurveyResultsPage({ params }: { params: Promise<{ slug: string; surveyId: string }> }) {
  const { slug, surveyId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();
  const { data: org } = await svc.from("orgs").select("id, name, slug, status").eq("slug", slug).single();
  if (!org || org.status !== "approved") notFound();

  const { data: myMembership } = await supabase.from("org_members").select("role, status").eq("org_id", org.id).eq("user_id", user.id).maybeSingle();
  if (myMembership?.status !== "active" || !["director", "officer"].includes(myMembership.role)) notFound();

  const { data: survey } = await svc.from("org_surveys").select("id, title, org_id").eq("id", surveyId).single();
  if (!survey || survey.org_id !== org.id) notFound();

  const [{ data: questions }, { data: responses }] = await Promise.all([
    svc.from("survey_questions").select("id, question_text, question_type, options").eq("survey_id", surveyId).order("sort_order"),
    svc.from("survey_responses").select("answers, submitted_at").eq("survey_id", surveyId).order("submitted_at", { ascending: false }),
  ]);

  const qs = questions ?? [];
  const rs = responses ?? [];

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link href={`/orgs/${slug}/surveys`} className="text-sm text-brand hover:underline">← Surveys</Link>
        <h1 className="text-2xl font-bold mt-1">{survey.title} — Results</h1>
        <p className="text-sm text-gray-500 mt-0.5">{rs.length} response{rs.length === 1 ? "" : "s"}</p>
      </div>

      {qs.map((q) => {
        const allAnswers = rs.map((r) => (r.answers as Record<string, string | string[]>)[q.id]).filter(Boolean);
        const opts = q.options as string[] | null;

        return (
          <div key={q.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="font-semibold text-sm">{q.question_text}</p>
            <p className="text-xs text-gray-400">{allAnswers.length} answer{allAnswers.length === 1 ? "" : "s"}</p>

            {q.question_type === "text" ? (
              <ul className="space-y-1.5">
                {(allAnswers as string[]).map((a, i) => (
                  <li key={i} className="text-sm bg-gray-50 rounded-lg px-3 py-2 text-gray-700">{a}</li>
                ))}
              </ul>
            ) : (
              <div className="space-y-1.5">
                {(opts ?? []).map((opt) => {
                  const count = allAnswers.filter((a) => {
                    if (Array.isArray(a)) return a.includes(opt);
                    return a === opt;
                  }).length;
                  const pct = rs.length > 0 ? Math.round((count / rs.length) * 100) : 0;
                  return (
                    <div key={opt}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span>{opt}</span>
                        <span className="text-gray-500">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
