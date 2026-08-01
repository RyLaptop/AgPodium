"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isOrgStaff } from "@/lib/auth/org-access";

export type Question = { text: string; type: "text" | "multiple_choice" | "checkbox"; options: string[] };

export async function createSurvey(orgId: string, orgSlug: string, title: string, description: string, isPublic: boolean, questions: Question[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  if (!await isOrgStaff(supabase, orgId, user.id)) return { ok: false as const, error: "Only staff can create surveys." };
  if (!title.trim()) return { ok: false as const, error: "Title required." };
  if (questions.length === 0) return { ok: false as const, error: "Add at least one question." };

  const svc = createServiceClient();
  const { data: survey, error } = await svc.from("org_surveys").insert({
    org_id: orgId, created_by: user.id, title: title.trim(), description: description.trim() || null, is_public: isPublic,
  }).select("id").single();
  if (error) return { ok: false as const, error: error.message };

  const qRows = questions.map((q, i) => ({
    survey_id: survey.id, question_text: q.text, question_type: q.type,
    options: q.options.length > 0 ? q.options : null, sort_order: i,
  }));
  const { error: qErr } = await svc.from("survey_questions").insert(qRows);
  if (qErr) return { ok: false as const, error: qErr.message };

  revalidatePath(`/orgs/${orgSlug}/surveys`);
  return { ok: true as const, surveyId: survey.id };
}

export async function deleteSurvey(surveyId: string, orgId: string, orgSlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  if (!await isOrgStaff(supabase, orgId, user.id)) return { ok: false as const, error: "Only staff can delete surveys." };
  const svc = createServiceClient();
  const { error } = await svc.from("org_surveys").delete().eq("id", surveyId).eq("org_id", orgId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/orgs/${orgSlug}/surveys`);
  return { ok: true as const };
}

export async function submitSurveyResponse(surveyId: string, orgSlug: string, answers: Record<string, string | string[]>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const svc = createServiceClient();
  const { error } = await svc.from("survey_responses").insert({
    survey_id: surveyId, user_id: user?.id ?? null, answers,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/orgs/${orgSlug}/surveys/${surveyId}`);
  return { ok: true as const };
}
