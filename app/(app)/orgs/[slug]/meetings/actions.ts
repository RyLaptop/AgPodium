"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateMeetingResult =
  | { ok: true; meetingId: string }
  | { ok: false; error: string };

export async function createMeeting(
  orgId: string,
  orgSlug: string,
  _prev: CreateMeetingResult | null,
  formData: FormData
): Promise<CreateMeetingResult> {
  const title = String(formData.get("title") ?? "").trim();
  const startsAtStr = String(formData.get("starts_at") ?? "").trim();
  const endsAtStr = String(formData.get("ends_at") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const agenda = String(formData.get("agenda") ?? "").trim();
  const slotsOpen = Number(formData.get("slots_open") ?? 3);
  const slotLength = Number(formData.get("slot_length_minutes") ?? 2);

  if (title.length < 2) return { ok: false, error: "Title is too short." };
  if (!startsAtStr) return { ok: false, error: "Start time is required." };

  const startsAt = new Date(startsAtStr);
  if (isNaN(startsAt.getTime()))
    return { ok: false, error: "Invalid start time." };

  const endsAt = endsAtStr ? new Date(endsAtStr) : null;
  if (endsAt && isNaN(endsAt.getTime()))
    return { ok: false, error: "Invalid end time." };
  if (endsAt && endsAt <= startsAt)
    return { ok: false, error: "End time must be after start time." };

  if (!Number.isInteger(slotsOpen) || slotsOpen < 0 || slotsOpen > 50)
    return { ok: false, error: "Slots open must be 0–50." };
  if (!Number.isInteger(slotLength) || slotLength < 1 || slotLength > 60)
    return { ok: false, error: "Slot length must be 1–60 minutes." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data, error } = await supabase
    .from("meetings")
    .insert({
      org_id: orgId,
      title,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt?.toISOString() ?? null,
      location: location || null,
      agenda: agenda || null,
      slots_open: slotsOpen,
      slot_length_minutes: slotLength,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/orgs/${orgSlug}`);
  redirect(`/orgs/${orgSlug}/meetings/${data.id}`);
}

export async function deleteMeeting(meetingId: string, orgSlug: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("meetings").delete().eq("id", meetingId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/orgs/${orgSlug}`);
  return { ok: true as const };
}
