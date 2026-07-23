"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateRequestResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createSpeakRequest(
  meetingId: string,
  orgSlug: string,
  _prev: CreateRequestResult | null,
  formData: FormData
): Promise<CreateRequestResult> {
  const pitch = String(formData.get("pitch") ?? "").trim();
  const requesterOrgId = String(formData.get("requester_org_id") ?? "").trim();
  const requestedMinutes = Number(formData.get("requested_minutes") ?? 2);

  if (pitch.length < 5) {
    return { ok: false, error: "Pitch is too short (min 5 chars)." };
  }
  if (!Number.isInteger(requestedMinutes) || requestedMinutes < 1) {
    return { ok: false, error: "Requested minutes must be 1 or more." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data, error } = await supabase
    .from("speak_requests")
    .insert({
      meeting_id: meetingId,
      requester_user_id: user.id,
      requester_org_id: requesterOrgId || null,
      pitch,
      requested_minutes: requestedMinutes,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/orgs/${orgSlug}/meetings/${meetingId}`);
  revalidatePath("/requests");
  redirect(`/requests/${data.id}`);
}

export async function decideRequest(
  id: string,
  decision: "approved" | "denied"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  // If approving, check the meeting still has slots
  if (decision === "approved") {
    const { data: req } = await supabase
      .from("speak_requests")
      .select("meeting_id")
      .eq("id", id)
      .single();
    if (req?.meeting_id) {
      const [{ data: meeting }, { count }] = await Promise.all([
        supabase
          .from("meetings")
          .select("slots_open")
          .eq("id", req.meeting_id)
          .single(),
        supabase
          .from("speak_requests")
          .select("*", { count: "exact", head: true })
          .eq("meeting_id", req.meeting_id)
          .in("status", ["approved", "completed"]),
      ]);
      if (
        meeting &&
        typeof count === "number" &&
        count >= meeting.slots_open
      ) {
        return {
          ok: false as const,
          error: "No open slots left for this meeting.",
        };
      }
    }
  }

  const { error } = await supabase
    .from("speak_requests")
    .update({
      status: decision,
      decided_by: user.id,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
  return { ok: true as const };
}

export async function cancelRequest(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("speak_requests")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
  return { ok: true as const };
}

export async function markCompleted(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("speak_requests")
    .update({ status: "completed" })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
  return { ok: true as const };
}

export async function markNoShow(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("speak_requests")
    .update({ status: "no_show" })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
  return { ok: true as const };
}
