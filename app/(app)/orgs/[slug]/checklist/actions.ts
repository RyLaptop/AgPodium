"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isOrgStaff } from "@/lib/auth/org-access";

async function getOrCreateChecklist(svc: ReturnType<typeof createServiceClient>, orgId: string) {
  const { data: existing } = await svc.from("onboarding_checklists").select("id").eq("org_id", orgId).maybeSingle();
  if (existing) return existing.id;
  const { data: created } = await svc.from("onboarding_checklists").insert({ org_id: orgId }).select("id").single();
  return created?.id ?? null;
}

export async function addChecklistItem(orgId: string, orgSlug: string, label: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  if (!await isOrgStaff(supabase, orgId, user.id)) return { ok: false as const, error: "Only staff can manage the checklist." };
  if (!label.trim()) return { ok: false as const, error: "Label required." };

  const svc = createServiceClient();
  const checklistId = await getOrCreateChecklist(svc, orgId);
  if (!checklistId) return { ok: false as const, error: "Could not create checklist." };

  const { data: existing } = await svc.from("onboarding_items").select("sort_order").eq("checklist_id", checklistId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const sortOrder = (existing?.sort_order ?? -1) + 1;

  const { error } = await svc.from("onboarding_items").insert({ checklist_id: checklistId, label: label.trim(), sort_order: sortOrder });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/orgs/${orgSlug}/checklist`);
  return { ok: true as const };
}

export async function deleteChecklistItem(itemId: string, orgId: string, orgSlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  if (!await isOrgStaff(supabase, orgId, user.id)) return { ok: false as const, error: "Only staff can manage the checklist." };
  const svc = createServiceClient();
  await svc.from("onboarding_items").delete().eq("id", itemId);
  revalidatePath(`/orgs/${orgSlug}/checklist`);
  return { ok: true as const };
}

export async function toggleCompletion(itemId: string, targetUserId: string, orgId: string, orgSlug: string, completed: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  if (!await isOrgStaff(supabase, orgId, user.id)) return { ok: false as const, error: "Only staff can mark completions." };
  const svc = createServiceClient();
  if (completed) {
    const { error } = await svc.from("member_checklist_completions").insert({ org_id: orgId, user_id: targetUserId, item_id: itemId, checked_by: user.id });
    if (error && error.code !== "23505") return { ok: false as const, error: error.message };
  } else {
    await svc.from("member_checklist_completions").delete().eq("user_id", targetUserId).eq("item_id", itemId);
  }
  revalidatePath(`/orgs/${orgSlug}/checklist`);
  return { ok: true as const };
}
