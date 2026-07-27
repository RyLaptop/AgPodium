"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { notify } from "@/lib/notifications";
import { sendEmail } from "@/lib/email/send";
import { speakDecisionEmail, waitlistPromotedEmail, orgIncomingSpeakRequestEmail } from "@/lib/email/templates";

export type CreateRequestResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function getMeetingsForOrgs(
  orgIds: string[]
): Promise<{ id: string; title: string; starts_at: string; org_id: string; org_name: string; slots_open: number; approved_count: number }[]> {
  if (orgIds.length === 0) return [];
  const svc = createServiceClient();
  const now = new Date().toISOString();
  const { data } = await svc
    .from("meetings")
    .select("id, title, starts_at, org_id, slots_open, orgs(name)")
    .in("org_id", orgIds)
    .gte("starts_at", now)
    .is("cancelled_at", null)
    .order("org_id")
    .order("starts_at", { ascending: true })
    .limit(100);

  const meetings = data ?? [];
  const meetingIds = meetings.map((m) => m.id);

  const { data: approvedRows } = meetingIds.length > 0
    ? await svc.from("speak_requests").select("meeting_id")
        .in("meeting_id", meetingIds).in("status", ["approved", "completed"])
    : { data: [] };

  const approvedByMeeting = new Map<string, number>();
  for (const row of approvedRows ?? []) {
    approvedByMeeting.set(row.meeting_id, (approvedByMeeting.get(row.meeting_id) ?? 0) + 1);
  }

  return meetings.map((m) => {
    const org = m.orgs as unknown as { name: string } | null;
    return {
      id: m.id,
      title: m.title,
      starts_at: m.starts_at,
      org_id: m.org_id,
      org_name: org?.name ?? "",
      slots_open: m.slots_open,
      approved_count: approvedByMeeting.get(m.id) ?? 0,
    };
  });
}

export async function submitSpeakRequests(
  targets: { meetingId: string; requesterOrgId: string | null }[],
  pitch: string,
  requestedMinutes: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (targets.length === 0) return { ok: false, error: "No meetings selected." };
  if (pitch.trim().length < 5) return { ok: false, error: "Pitch is too short (min 5 chars)." };
  if (!Number.isInteger(requestedMinutes) || requestedMinutes < 1) {
    return { ok: false, error: "Minutes must be at least 1." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Check fullness server-side for each meeting to set waitlist status
  const svcCheck = createServiceClient();
  const meetingIds = targets.map((t) => t.meetingId);
  const [{ data: meetingSlots }, { data: approvedCounts }] = await Promise.all([
    svcCheck.from("meetings").select("id, slots_open").in("id", meetingIds),
    svcCheck.from("speak_requests").select("meeting_id")
      .in("meeting_id", meetingIds).in("status", ["approved", "completed"]),
  ]);
  const slotMap = new Map((meetingSlots ?? []).map((m) => [m.id, m.slots_open]));
  const approvedMap = new Map<string, number>();
  for (const row of approvedCounts ?? []) {
    approvedMap.set(row.meeting_id, (approvedMap.get(row.meeting_id) ?? 0) + 1);
  }

  const rows = targets.map((t) => {
    const slotsOpen = slotMap.get(t.meetingId) ?? 0;
    const approved = approvedMap.get(t.meetingId) ?? 0;
    const isFull = approved >= slotsOpen;
    return {
      meeting_id: t.meetingId,
      requester_user_id: user.id,
      requester_org_id: t.requesterOrgId || null,
      pitch: pitch.trim(),
      requested_minutes: requestedMinutes,
      status: isFull ? "waitlisted" : "pending",
    };
  });

  const { error } = await supabase.from("speak_requests").insert(rows);
  if (error) return { ok: false, error: error.message };

  // Notify officers of each target meeting's org
  const svc = createServiceClient();
  const notifMeetingIds = targets.map((t) => t.meetingId);
  const [{ data: meetingRows }, { data: me }] = await Promise.all([
    svc.from("meetings").select("id, org_id, title, orgs(name, slug)").in("id", notifMeetingIds),
    supabase.from("users").select("full_name, email").eq("id", user.id).single(),
  ]);

  const requesterName = me?.full_name ?? user.email ?? "Someone";
  // requester's org name (if submitting on behalf of an org)
  const requesterOrgId = targets[0]?.requesterOrgId ?? null;
  const requesterOrgName = requesterOrgId
    ? await svc.from("orgs").select("name").eq("id", requesterOrgId).single().then((r) => r.data?.name ?? null)
    : null;
  const firstPitch = targets.length > 0 ? rows[0].pitch : "";

  for (const m of meetingRows ?? []) {
    const orgName = (m.orgs as unknown as { name: string; slug: string } | null)?.name ?? "";
    const orgSlug = (m.orgs as unknown as { name: string; slug: string } | null)?.slug ?? "";
    const meetingPath = orgSlug ? `/orgs/${orgSlug}/meetings/${m.id}` : "/requests";

    const [{ data: officers }, { data: orgData }] = await Promise.all([
      svc.from("org_members").select("user_id").eq("org_id", m.org_id).in("role", ["officer", "director"]).eq("status", "active"),
      svc.from("orgs").select("contact_email").eq("id", m.org_id).single(),
    ]);

    if (officers && officers.length > 0) {
      await notify(
        officers.map((o) => ({
          userId: o.user_id,
          type: "request_update" as const,
          title: `New speak request: ${m.title}`,
          body: `${requesterName}${orgName ? ` (${orgName})` : ""} wants to speak`,
          link: meetingPath,
        }))
      );
    }

    const contactEmail = (orgData as unknown as { contact_email?: string | null } | null)?.contact_email;
    if (contactEmail) {
      const tmpl = orgIncomingSpeakRequestEmail({
        orgName,
        requesterName,
        requesterOrgName,
        meetingTitle: m.title,
        pitch: firstPitch,
        meetingPath,
      });
      await sendEmail({ to: contactEmail, ...tmpl });
    }
  }

  revalidatePath("/requests");
  return { ok: true };
}

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

  if (requesterOrgId) {
    const { data: mem } = await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", requesterOrgId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (!mem || !["officer", "director"].includes(mem.role)) {
      return { ok: false, error: "You must be an officer or director to request on behalf of an org." };
    }
  }

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

  // Notify officers/directors of the target org
  const [{ data: meeting }, { data: me }] = await Promise.all([
    supabase.from("meetings").select("org_id, title, orgs(name)").eq("id", meetingId).single(),
    supabase.from("users").select("full_name, email").eq("id", user.id).single(),
  ]);
  if (meeting) {
    const orgName = (meeting.orgs as unknown as { name: string } | null)?.name ?? "";
    const requesterName = me?.full_name ?? user.email ?? "Someone";
    const svc2 = createServiceClient();
    const [{ data: officers }, { data: orgContact }] = await Promise.all([
      supabase.from("org_members").select("user_id").eq("org_id", meeting.org_id).in("role", ["officer", "director"]).eq("status", "active"),
      svc2.from("orgs").select("contact_email, slug").eq("id", meeting.org_id).single(),
    ]);
    if (officers && officers.length > 0) {
      await notify(officers.map((o) => ({
        userId: o.user_id,
        type: "request_update",
        title: `New speak request: ${meeting.title}`,
        body: `${requesterName}${orgName ? ` (${orgName})` : ""} wants to speak`,
        link: `/requests/${data.id}`,
      })));
    }
    const orgContactEmail = (orgContact as unknown as { contact_email?: string | null; slug?: string } | null)?.contact_email;
    const orgSlugReal = (orgContact as unknown as { contact_email?: string | null; slug?: string } | null)?.slug ?? orgSlug;
    if (orgContactEmail) {
      const tmpl = orgIncomingSpeakRequestEmail({
        orgName,
        requesterName,
        requesterOrgName: requesterOrgId ? null : null,
        meetingTitle: meeting.title,
        pitch,
        meetingPath: `/orgs/${orgSlugReal}/meetings/${meetingId}`,
      });
      await sendEmail({ to: orgContactEmail, ...tmpl });
    }
  }

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

  let approvedMeetingId: string | null = null;
  let nextSpeakerOrder: number | null = null;

  // If approving, check the meeting still has slots and compute speaker_order
  if (decision === "approved") {
    const { data: req } = await supabase
      .from("speak_requests")
      .select("meeting_id")
      .eq("id", id)
      .single();
    if (req?.meeting_id) {
      approvedMeetingId = req.meeting_id;
      const [{ data: meeting }, { count }, { data: orderRows }] = await Promise.all([
        supabase.from("meetings").select("slots_open").eq("id", req.meeting_id).single(),
        supabase
          .from("speak_requests")
          .select("*", { count: "exact", head: true })
          .eq("meeting_id", req.meeting_id)
          .in("status", ["approved", "completed"]),
        supabase
          .from("speak_requests")
          .select("speaker_order")
          .eq("meeting_id", req.meeting_id)
          .not("speaker_order", "is", null)
          .order("speaker_order", { ascending: false })
          .limit(1),
      ]);
      if (meeting && typeof count === "number" && count >= meeting.slots_open) {
        return { ok: false as const, error: "No open slots left for this meeting." };
      }
      nextSpeakerOrder = ((orderRows?.[0]?.speaker_order as number | null) ?? 0) + 1;
    }
  }

  const { error } = await supabase
    .from("speak_requests")
    .update({
      status: decision,
      decided_by: user.id,
      decided_at: new Date().toISOString(),
      requester_read_at: null,
      ...(nextSpeakerOrder !== null ? { speaker_order: nextSpeakerOrder } : {}),
    })
    .eq("id", id);

  if (error) return { ok: false as const, error: error.message };

  // After an approval, check if the meeting is now full and auto-deny the rest.
  if (decision === "approved") {
    const { data: req } = await supabase
      .from("speak_requests")
      .select("meeting_id")
      .eq("id", id)
      .single();

    if (req?.meeting_id) {
      const [{ data: meeting }, { count: filledCount }] = await Promise.all([
        supabase.from("meetings").select("slots_open").eq("id", req.meeting_id).single(),
        supabase
          .from("speak_requests")
          .select("*", { count: "exact", head: true })
          .eq("meeting_id", req.meeting_id)
          .in("status", ["approved", "completed"]),
      ]);

      if (meeting && typeof filledCount === "number" && filledCount >= meeting.slots_open) {
        await supabase
          .from("speak_requests")
          .update({ status: "denied", decided_by: user.id, decided_at: new Date().toISOString(), requester_read_at: null })
          .eq("meeting_id", req.meeting_id)
          .eq("status", "pending");
      }
    }
  }

  // Notify requester of decision
  const svc = createServiceClient();
  const { data: notifReq } = await supabase
    .from("speak_requests")
    .select("requester_user_id, meetings(title, orgs(name))")
    .eq("id", id)
    .single();
  if (notifReq) {
    const m = notifReq.meetings as unknown as { title: string; orgs: { name: string } } | null;
    await notify([{
      userId: notifReq.requester_user_id,
      type: "request_update",
      title: decision === "approved" ? "Your request was approved!" : "Your request was denied",
      body: m ? `${m.orgs.name} · ${m.title}` : undefined,
      link: `/requests/${id}`,
    }]);
    if (m) {
      const { data: requester } = await svc.from("users").select("email, full_name").eq("id", notifReq.requester_user_id).single();
      if (requester?.email) {
        const tmpl = speakDecisionEmail({
          recipientName: requester.full_name ?? requester.email.split("@")[0],
          orgName: m.orgs.name,
          meetingTitle: m.title,
          approved: decision === "approved",
          requestPath: `/requests/${id}`,
        });
        await sendEmail({ to: requester.email, ...tmpl });
      }
    }
  }

  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
  return { ok: true as const };
}

export async function clearRequest(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  // Use service client so RLS can't silently block the delete.
  // Ownership is enforced manually via the requester_user_id + status conditions.
  const admin = createServiceClient();
  const { error, count } = await admin
    .from("speak_requests")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("requester_user_id", user.id)
    .eq("status", "denied");

  if (error) return { ok: false as const, error: error.message };
  if (count === 0) return { ok: false as const, error: "Request not found or already cleared." };

  revalidatePath("/requests");
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
  const { data: req } = await supabase
    .from("speak_requests")
    .select("requester_user_id, meetings(title, orgs(name))")
    .eq("id", id).single();
  if (req) {
    const m = req.meetings as unknown as { title: string; orgs: { name: string } } | null;
    await notify([{ userId: req.requester_user_id, type: "request_update", title: "Appearance marked as completed", body: m ? `${m.orgs.name} · ${m.title}` : undefined, link: `/requests/${id}` }]);
  }
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
  const { data: req } = await supabase
    .from("speak_requests")
    .select("requester_user_id, meetings(title, orgs(name))")
    .eq("id", id).single();
  if (req) {
    const m = req.meetings as unknown as { title: string; orgs: { name: string } } | null;
    await notify([{ userId: req.requester_user_id, type: "request_update", title: "Marked as no-show", body: m ? `${m.orgs.name} · ${m.title}` : undefined, link: `/requests/${id}` }]);
  }
  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
  return { ok: true as const };
}

async function renumberSpeakers(meetingId: string, admin: ReturnType<typeof createServiceClient>) {
  const { data: speakers } = await admin
    .from("speak_requests")
    .select("id, speaker_order")
    .eq("meeting_id", meetingId)
    .in("status", ["approved", "completed"])
    .order("speaker_order", { ascending: true, nullsFirst: false });

  if (!speakers || speakers.length === 0) return;

  await Promise.all(
    speakers.map((s, idx) =>
      admin.from("speak_requests").update({ speaker_order: idx + 1 }).eq("id", s.id)
    )
  );
}

export async function cancelApproved(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  // Use service client to read the request — RLS may block officers from reading
  // approved requests they didn't create.
  const admin = createServiceClient();
  const { data: req } = await admin
    .from("speak_requests")
    .select("requester_user_id, meeting_id, meetings(org_id, title, orgs(name, slug))")
    .eq("id", id)
    .single();
  if (!req) return { ok: false as const, error: "Request not found." };

  const meeting = req.meetings as unknown as { org_id: string; title: string; orgs: { name: string; slug: string } };

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", meeting.org_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership || !["officer", "director"].includes(membership.role)) {
    return { ok: false as const, error: "Not authorized." };
  }

  const { error } = await admin
    .from("speak_requests")
    .update({ status: "cancelled", decided_by: user.id, decided_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["approved", "completed"]);

  if (error) return { ok: false as const, error: error.message };

  await notify([{
    userId: req.requester_user_id,
    type: "request_update",
    title: "Approved request was cancelled",
    body: `${meeting.orgs.name} · ${meeting.title}`,
    link: `/requests/${id}`,
  }]);

  // Renumber remaining speakers so there are no gaps
  await renumberSpeakers(req.meeting_id, admin);

  // Auto-promote the first waitlisted request
  const { data: firstWaiter } = await admin
    .from("speak_requests")
    .select("id, requester_user_id")
    .eq("meeting_id", req.meeting_id)
    .eq("status", "waitlisted")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (firstWaiter) {
    const { data: orderRows } = await admin
      .from("speak_requests")
      .select("speaker_order")
      .eq("meeting_id", req.meeting_id)
      .not("speaker_order", "is", null)
      .in("status", ["approved", "completed"])
      .order("speaker_order", { ascending: false })
      .limit(1);
    const nextOrder = ((orderRows?.[0]?.speaker_order as number | null) ?? 0) + 1;

    await admin
      .from("speak_requests")
      .update({
        status: "approved",
        speaker_order: nextOrder,
        decided_by: user.id,
        decided_at: new Date().toISOString(),
        requester_read_at: null,
      })
      .eq("id", firstWaiter.id);

    await notify([{
      userId: firstWaiter.requester_user_id,
      type: "request_update",
      title: "You've been moved off the waitlist!",
      body: `${meeting.orgs.name} · ${meeting.title} — you're now approved to speak`,
      link: `/requests/${firstWaiter.id}`,
    }]);
    const { data: waiterUser } = await admin.from("users").select("email, full_name").eq("id", firstWaiter.requester_user_id).single();
    if (waiterUser?.email) {
      const { data: meetingFull } = await admin.from("meetings").select("starts_at, location").eq("id", req.meeting_id).single();
      const tmpl = waitlistPromotedEmail({
        recipientName: waiterUser.full_name ?? waiterUser.email.split("@")[0],
        orgName: meeting.orgs.name,
        meetingTitle: meeting.title,
        startsAt: meetingFull?.starts_at ?? new Date().toISOString(),
        location: meetingFull?.location ?? null,
        requestPath: `/requests/${firstWaiter.id}`,
      });
      await sendEmail({ to: waiterUser.email, ...tmpl });
    }
  }

  revalidatePath(`/orgs/${meeting.orgs.slug}/meetings/${req.meeting_id}`);
  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
  return { ok: true as const };
}

export async function moveSpeaker(
  requestId: string,
  direction: "up" | "down",
  meetingId: string,
  orgSlug: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: req } = await supabase
    .from("speak_requests")
    .select("meetings(org_id)")
    .eq("id", requestId)
    .single();
  if (!req) return { ok: false as const, error: "Request not found." };

  const meeting = req.meetings as unknown as { org_id: string };
  const { data: myMem } = await supabase
    .from("org_members").select("role")
    .eq("org_id", meeting.org_id).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!myMem || !["officer", "director"].includes(myMem.role)) {
    return { ok: false as const, error: "Not authorized." };
  }

  // Fetch all speakers sorted by order to find adjacent by position (handles gaps)
  const admin = createServiceClient();
  const [{ data: allSpeakers }, { data: meetingInfo }] = await Promise.all([
    admin
      .from("speak_requests")
      .select("id, speaker_order, requester_user_id")
      .eq("meeting_id", meetingId)
      .in("status", ["approved", "completed"])
      .order("speaker_order", { ascending: true, nullsFirst: false }),
    admin
      .from("meetings")
      .select("title, orgs(name)")
      .eq("id", meetingId)
      .single(),
  ]);

  if (!allSpeakers) return { ok: false as const, error: "Could not load speakers." };

  const idx = allSpeakers.findIndex((s) => s.id === requestId);
  if (idx === -1) return { ok: false as const, error: "Speaker not found in lineup." };

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= allSpeakers.length) {
    return { ok: false as const, error: "Already at the edge of the lineup." };
  }

  const current = allSpeakers[idx];
  const swap = allSpeakers[swapIdx];

  const orderA = current.speaker_order ?? idx + 1;
  const orderB = swap.speaker_order ?? swapIdx + 1;

  const [res1, res2] = await Promise.all([
    admin.from("speak_requests").update({ speaker_order: orderB }).eq("id", current.id),
    admin.from("speak_requests").update({ speaker_order: orderA }).eq("id", swap.id),
  ]);

  if (res1.error) return { ok: false as const, error: res1.error.message };
  if (res2.error) return { ok: false as const, error: res2.error.message };

  // Compact any gaps left from prior cancellations
  await renumberSpeakers(meetingId, admin);

  // Notify both affected speakers
  if (meetingInfo) {
    const orgName = (meetingInfo.orgs as unknown as { name: string } | null)?.name ?? "";
    const notifBody = `${orgName} · ${meetingInfo.title}`;
    await notify([
      {
        userId: current.requester_user_id,
        type: "request_update",
        title: "Your speaking order has been updated",
        body: notifBody,
        link: `/requests/${current.id}`,
      },
      {
        userId: swap.requester_user_id,
        type: "request_update",
        title: "Your speaking order has been updated",
        body: notifBody,
        link: `/requests/${swap.id}`,
      },
    ]);
  }

  revalidatePath(`/orgs/${orgSlug}/meetings/${meetingId}`);
  return { ok: true as const };
}

export async function selfConfirm(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const admin = createServiceClient();
  const { error } = await admin
    .from("speak_requests")
    .update({ status: "completed" })
    .eq("id", id)
    .eq("requester_user_id", user.id)
    .eq("status", "approved");

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
  return { ok: true as const };
}

export async function submitFeedback(id: string, ghosted: boolean, feedback: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const admin = createServiceClient();
  const { error } = await admin
    .from("speak_requests")
    .update({
      speaker_ghosted: ghosted,
      speaker_feedback: feedback.trim() || null,
      speaker_feedback_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("requester_user_id", user.id)
    .eq("status", "completed");

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
  return { ok: true as const };
}

export async function reportGhost(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const admin = createServiceClient();
  const { error } = await admin
    .from("speak_requests")
    .update({ status: "disputed" })
    .eq("id", id)
    .eq("requester_user_id", user.id)
    .eq("status", "approved");

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
  return { ok: true as const };
}

export async function sendChatMessage(requestId: string, body: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in", data: null };

  const { data: msg, error: insertError } = await supabase
    .from("chat_messages")
    .insert({ speak_request_id: requestId, user_id: user.id, body })
    .select()
    .single();

  if (insertError) return { ok: false as const, error: insertError.message, data: null };

  const { data: req } = await supabase
    .from("speak_requests")
    .select("requester_user_id, meetings(org_id, title, orgs(name))")
    .eq("id", requestId)
    .single();

  if (req) {
    const m = req.meetings as unknown as { org_id: string; title: string; orgs: { name: string } } | null;
    const { data: officers } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", m?.org_id ?? "")
      .in("role", ["officer", "director"])
      .eq("status", "active");

    const recipients = new Set<string>();
    recipients.add(req.requester_user_id);
    (officers ?? []).forEach((o) => recipients.add(o.user_id));
    recipients.delete(user.id);

    if (recipients.size > 0 && m) {
      await notify([...recipients].map((userId) => ({
        userId,
        type: "chat_message",
        title: `New message: ${m.orgs.name} · ${m.title}`,
        body: body.length > 100 ? body.slice(0, 100) + "…" : body,
        link: `/requests/${requestId}`,
      })));
    }
  }

  return { ok: true as const, data: msg, error: null };
}
