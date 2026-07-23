"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SubmitBulletinResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function submitBulletinPost(
  _prev: SubmitBulletinResult | null,
  formData: FormData
): Promise<SubmitBulletinResult> {
  const eventTitle = String(formData.get("event_title") ?? "").trim();
  const eventDescription = String(formData.get("event_description") ?? "").trim();
  const eventAtStr = String(formData.get("event_at") ?? "").trim();
  const eventLocation = String(formData.get("event_location") ?? "").trim();
  const orgId = String(formData.get("org_id") ?? "").trim();

  if (eventTitle.length < 3) {
    return { ok: false, error: "Title is too short (min 3 chars)." };
  }
  if (!eventAtStr) {
    return { ok: false, error: "Event date/time is required." };
  }
  const eventAt = new Date(eventAtStr);
  if (isNaN(eventAt.getTime())) {
    return { ok: false, error: "Invalid date/time." };
  }
  if (eventAt.getTime() < Date.now() - 60 * 60 * 1000) {
    return { ok: false, error: "Event date is in the past." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data, error } = await supabase
    .from("bulletin_posts")
    .insert({
      submitter_id: user.id,
      org_id: orgId || null,
      event_title: eventTitle,
      event_description: eventDescription || null,
      event_at: eventAt.toISOString(),
      event_location: eventLocation || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/bulletin");
  redirect("/bulletin?submitted=1");
}

export async function reviewBulletinPost(
  id: string,
  decision: "approved" | "denied"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("bulletin_posts")
    .update({
      status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/bulletin");
  revalidatePath("/bulletin/admin");
  return { ok: true as const };
}
