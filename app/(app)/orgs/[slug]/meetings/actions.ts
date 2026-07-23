"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { notify } from "@/lib/notifications";

export type CreateMeetingResult =
  | { ok: true; meetingId: string }
  | { ok: false; error: string };

function addInterval(date: Date, type: string, n: number): Date {
  const d = new Date(date);
  if (type === "weekly") d.setDate(d.getDate() + n * 7);
  else if (type === "biweekly") d.setDate(d.getDate() + n * 14);
  else if (type === "monthly") d.setMonth(d.getMonth() + n);
  return d;
}

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
  const repeatType = String(formData.get("repeat_type") ?? "none");
  const repeatCount = Math.min(24, Math.max(2, Number(formData.get("repeat_count") ?? 4)));

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

  const base = {
    org_id: orgId,
    title,
    location: location || null,
    agenda: agenda || null,
    slots_open: slotsOpen,
    slot_length_minutes: slotLength,
    created_by: user.id,
  };

  const isRecurring = repeatType !== "none";
  const count = isRecurring ? repeatCount : 1;

  const rows = Array.from({ length: count }, (_, i) => ({
    ...base,
    starts_at: addInterval(startsAt, repeatType, i).toISOString(),
    ends_at: endsAt ? addInterval(endsAt, repeatType, i).toISOString() : null,
  }));

  const { data: inserted, error } = await supabase
    .from("meetings")
    .insert(rows)
    .select("id")
  if (error) return { ok: false, error: error.message };

  const firstId = inserted?.[0]?.id;

  // Notify members
  const { data: members } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("status", "active")
    .neq("user_id", user.id);
  const { data: org } = await supabase.from("orgs").select("name").eq("id", orgId).single();
  if (members && members.length > 0 && org) {
    const notifTitle = isRecurring
      ? `New recurring meeting: ${title} (${count}×)`
      : `New meeting: ${title}`;
    await notify(members.map((m) => ({
      userId: m.user_id,
      type: "org_meeting",
      title: notifTitle,
      body: `${org.name} has scheduled a new meeting`,
      link: firstId ? `/orgs/${orgSlug}/meetings/${firstId}` : `/orgs/${orgSlug}`,
    })));
  }

  revalidatePath(`/orgs/${orgSlug}`);
  if (isRecurring) redirect(`/orgs/${orgSlug}`);
  else redirect(`/orgs/${orgSlug}/meetings/${firstId}`);
}

// ── Waitlist ──────────────────────────────────────────────────────────────────

export async function joinWaitlist(
  meetingId: string,
  orgSlug: string,
  data: { pitch: string; requestedMinutes: number; requesterOrgId: string | null }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  if (data.pitch.length < 5) return { ok: false as const, error: "Pitch must be at least 5 characters." };
  if (data.requestedMinutes < 1) return { ok: false as const, error: "Minutes must be at least 1." };

  const { data: existing } = await supabase
    .from("speak_requests")
    .select("id")
    .eq("meeting_id", meetingId)
    .eq("requester_user_id", user.id)
    .in("status", ["pending", "approved", "waitlisted"])
    .maybeSingle();
  if (existing) return { ok: false as const, error: "You already have a request for this meeting." };

  const { error } = await supabase
    .from("speak_requests")
    .insert({
      meeting_id: meetingId,
      requester_user_id: user.id,
      requester_org_id: data.requesterOrgId || null,
      pitch: data.pitch,
      requested_minutes: data.requestedMinutes,
      status: "waitlisted",
    });

  if (error) return { ok: false as const, error: error.message };

  // Notify org officers/directors
  const [{ data: meeting }, { data: me }] = await Promise.all([
    supabase.from("meetings").select("org_id, title, orgs(name)").eq("id", meetingId).single(),
    supabase.from("users").select("full_name, email").eq("id", user.id).single(),
  ]);
  if (meeting) {
    const requesterName = me?.full_name ?? user.email ?? "Someone";
    const { data: officers } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", meeting.org_id)
      .in("role", ["officer", "director"])
      .eq("status", "active");
    if (officers && officers.length > 0) {
      await notify(officers.map((o) => ({
        userId: o.user_id,
        type: "request_update" as const,
        title: `Waitlist: ${meeting.title}`,
        body: `${requesterName} joined the waitlist`,
        link: `/orgs/${orgSlug}/meetings/${meetingId}`,
      })));
    }
  }

  revalidatePath(`/orgs/${orgSlug}/meetings/${meetingId}`);
  return { ok: true as const };
}

export async function leaveWaitlist(meetingId: string, orgSlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("speak_requests")
    .update({ status: "cancelled" })
    .eq("meeting_id", meetingId)
    .eq("requester_user_id", user.id)
    .eq("status", "waitlisted");

  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/orgs/${orgSlug}/meetings/${meetingId}`);
  return { ok: true as const };
}

export async function deleteMeeting(meetingId: string, orgSlug: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("meetings").delete().eq("id", meetingId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/orgs/${orgSlug}`);
  return { ok: true as const };
}

export async function updateMeeting(
  meetingId: string,
  orgSlug: string,
  data: {
    title: string;
    startsAt: string;
    endsAt: string;
    location: string;
    agenda: string;
    slotsOpen: number;
    slotLength: number;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: meeting } = await supabase
    .from("meetings").select("org_id").eq("id", meetingId).single();
  if (!meeting) return { ok: false as const, error: "Meeting not found." };

  const { data: myMem } = await supabase
    .from("org_members").select("role")
    .eq("org_id", meeting.org_id).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!myMem || !["officer", "director"].includes(myMem.role)) {
    return { ok: false as const, error: "Not authorized." };
  }

  if (data.title.length < 2) return { ok: false as const, error: "Title is too short." };
  const startsAt = new Date(data.startsAt);
  if (isNaN(startsAt.getTime())) return { ok: false as const, error: "Invalid start time." };
  const endsAt = data.endsAt ? new Date(data.endsAt) : null;
  if (endsAt && endsAt <= startsAt) return { ok: false as const, error: "End time must be after start time." };

  const svc = createServiceClient();
  const { error } = await svc.from("meetings").update({
    title: data.title,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt?.toISOString() ?? null,
    location: data.location || null,
    agenda: data.agenda || null,
    slots_open: data.slotsOpen,
    slot_length_minutes: data.slotLength,
  }).eq("id", meetingId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/orgs/${orgSlug}/meetings/${meetingId}`);
  revalidatePath(`/orgs/${orgSlug}`);
  return { ok: true as const };
}
