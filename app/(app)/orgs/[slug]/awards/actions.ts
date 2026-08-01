"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function isActiveStaff(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string, userId: string) {
  const { data } = await supabase.from("org_members").select("role")
    .eq("org_id", orgId).eq("user_id", userId).eq("status", "active").single();
  return data?.role === "director" || data?.role === "officer";
}

export async function createAward(orgId: string, orgSlug: string, name: string, description: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  if (!await isActiveStaff(supabase, orgId, user.id)) return { ok: false as const, error: "Only staff can create awards." };
  if (!name.trim()) return { ok: false as const, error: "Award name required." };

  const svc = createServiceClient();
  const { error } = await svc.from("org_awards").insert({
    org_id: orgId, name: name.trim(), description: description.trim() || null,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/orgs/${orgSlug}/awards`);
  return { ok: true as const };
}

export async function deleteAward(awardId: string, orgId: string, orgSlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  if (!await isActiveStaff(supabase, orgId, user.id)) return { ok: false as const, error: "Only staff can delete awards." };

  const svc = createServiceClient();
  await svc.from("member_awards").delete().eq("award_id", awardId);
  await svc.from("org_awards").delete().eq("id", awardId).eq("org_id", orgId);
  revalidatePath(`/orgs/${orgSlug}/awards`);
  return { ok: true as const };
}

export async function assignAward(awardId: string, targetUserId: string, orgId: string, orgSlug: string, note: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  if (!await isActiveStaff(supabase, orgId, user.id)) return { ok: false as const, error: "Only staff can assign awards." };

  const svc = createServiceClient();
  const { error } = await svc.from("member_awards").insert({
    award_id: awardId, org_id: orgId, user_id: targetUserId, awarded_by: user.id, note: note.trim() || null,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/orgs/${orgSlug}/awards`);
  return { ok: true as const };
}

export async function revokeAward(memberAwardId: string, orgId: string, orgSlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  if (!await isActiveStaff(supabase, orgId, user.id)) return { ok: false as const, error: "Only staff can revoke awards." };

  const svc = createServiceClient();
  await svc.from("member_awards").delete().eq("id", memberAwardId).eq("org_id", orgId);
  revalidatePath(`/orgs/${orgSlug}/awards`);
  return { ok: true as const };
}
