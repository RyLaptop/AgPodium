"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function toggleOpenHouse(university: string, active: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };
  const { data: p } = await supabase.from("users").select("is_site_admin").eq("id", user.id).single();
  if (!p?.is_site_admin) return { ok: false as const, error: "Admins only" };

  const svc = createServiceClient();
  await svc.from("open_house_settings").upsert(
    { university, is_active: active, updated_at: new Date().toISOString() },
    { onConflict: "university" }
  );
  revalidatePath("/open-house");
  revalidatePath("/bulletin/admin");
  return { ok: true as const };
}

export async function toggleTestMode(university: string, testMode: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };
  const { data: p } = await supabase.from("users").select("is_site_admin").eq("id", user.id).single();
  if (!p?.is_site_admin) return { ok: false as const, error: "Admins only" };

  const svc = createServiceClient();
  await svc.from("open_house_settings").upsert(
    { university, is_test_mode: testMode, updated_at: new Date().toISOString() },
    { onConflict: "university" }
  );
  revalidatePath("/open-house");
  revalidatePath("/bulletin/admin");
  return { ok: true as const };
}

export async function stampPassport(orgId: string, action: "video" | "link" | "event") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sign in to track your passport" };

  const field = action === "video" ? "video_watched" : action === "link" ? "link_clicked" : "event_added";

  // Try insert first; if conflict, update only the relevant field
  const { error: insertErr } = await supabase
    .from("passport_stamps")
    .insert({ user_id: user.id, org_id: orgId, [field]: true });

  if (insertErr && insertErr.code === "23505") {
    await supabase
      .from("passport_stamps")
      .update({ [field]: true })
      .eq("user_id", user.id)
      .eq("org_id", orgId);
  } else if (insertErr) {
    return { ok: false as const, error: insertErr.message };
  }

  return { ok: true as const };
}
