import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { SpeakRequestForm } from "./_request-form";
import { OfficerRequestList } from "./_officer-list";
import { WaitlistButton } from "./_waitlist";
import { EditMeeting } from "./_edit-meeting";
import { SpeakerManage } from "./_speaker-manage";
import { StaffChat } from "./_staff-chat";
import type { ChatMessage, ChatUser } from "@/app/(app)/requests/[id]/_chat";

export const dynamic = "force-dynamic";

export default async function MeetingPage({
  params,
}: {
  params: Promise<{ slug: string; meetingId: string }>;
}) {
  const { slug, meetingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: meeting } = await supabase
    .from("meetings")
    .select(
      "id, title, agenda, location, starts_at, ends_at, slots_open, slot_length_minutes, org_id, orgs(name, slug)"
    )
    .eq("id", meetingId)
    .single();

  if (!meeting) notFound();

  const org = meeting.orgs as unknown as { name: string; slug: string };

  const { data: myMembership } = user
    ? await supabase
        .from("org_members")
        .select("role, status")
        .eq("org_id", meeting.org_id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()
    : { data: null };

  const isOfficer =
    myMembership?.role === "officer" || myMembership?.role === "director";

  const svc = createServiceClient();
  const [{ data: approvedSpeakers }, { data: incoming }, { data: myOrgs }] =
    await Promise.all([
      svc
        .from("speak_requests")
        .select(
          "id, pitch, requested_minutes, status, speaker_order, requester_user_id, users!speak_requests_requester_user_id_fkey(full_name, email), orgs!speak_requests_requester_org_id_fkey(name, slug)"
        )
        .eq("meeting_id", meetingId)
        .in("status", ["approved", "completed"])
        .order("speaker_order", { ascending: true, nullsFirst: false }),
      isOfficer
        ? supabase
            .from("speak_requests")
            .select(
              "id, pitch, requested_minutes, status, created_at, users!speak_requests_requester_user_id_fkey(full_name, email), orgs!speak_requests_requester_org_id_fkey(name, slug)"
            )
            .eq("meeting_id", meetingId)
            .eq("status", "pending")
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [] }),
      user
        ? supabase
            .from("org_members")
            .select("orgs(id, name)")
            .eq("user_id", user.id)
            .eq("status", "active")
            .in("role", ["officer", "director"])
        : Promise.resolve({ data: [] }),
    ]);

  const usedSlots = approvedSpeakers?.length ?? 0;
  const slotsRemaining = Math.max(0, meeting.slots_open - usedSlots);
  const inFuture = new Date(meeting.starts_at) > new Date();

  const { data: myExistingRequest } = user
    ? await supabase
        .from("speak_requests")
        .select("id, status")
        .eq("meeting_id", meetingId)
        .eq("requester_user_id", user.id)
        .in("status", ["pending", "approved"])
        .maybeSingle()
    : { data: null };

  // Waitlist: stored as speak_requests with status="waitlisted"
  const [{ data: waitlistRows }, { data: myWaitlistRequest }] = await Promise.all([
    svc.from("speak_requests").select("id").eq("meeting_id", meetingId).eq("status", "waitlisted"),
    user
      ? supabase
          .from("speak_requests")
          .select("id")
          .eq("meeting_id", meetingId)
          .eq("requester_user_id", user.id)
          .eq("status", "waitlisted")
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const waitlistCount = waitlistRows?.length ?? 0;
  const onWaitlist = !!myWaitlistRequest;

  // Officer chat: fetch messages + participants for all approved speakers
  let staffChatSpeakers: { requestId: string; label: string; sublabel?: string }[] = [];
  let staffChatMessages: Record<string, ChatMessage[]> = {};
  let staffChatUsers: ChatUser[] = [];

  if (isOfficer && user && (approvedSpeakers?.length ?? 0) > 0) {
    const requestIds = (approvedSpeakers ?? []).map((s) => s.id);
    const [{ data: chatRows }, { data: officerMemberRows }] = await Promise.all([
      svc
        .from("chat_messages")
        .select("id, speak_request_id, user_id, body, created_at")
        .in("speak_request_id", requestIds)
        .order("created_at", { ascending: true }),
      svc
        .from("org_members")
        .select("users(id, full_name, email)")
        .eq("org_id", meeting.org_id)
        .in("role", ["officer", "director"])
        .eq("status", "active"),
    ]);

    // Group messages by request
    for (const row of chatRows ?? []) {
      const rid = (row as { speak_request_id: string }).speak_request_id;
      if (!staffChatMessages[rid]) staffChatMessages[rid] = [];
      staffChatMessages[rid].push(row as unknown as ChatMessage);
    }

    // Build deduplicated user list
    const seen = new Set<string>();
    for (const row of officerMemberRows ?? []) {
      const u = row.users as unknown as ChatUser | null;
      if (u && !seen.has(u.id)) { staffChatUsers.push(u); seen.add(u.id); }
    }
    for (const s of approvedSpeakers ?? []) {
      const u = s.users as unknown as ChatUser;
      if (u && !seen.has(u.id)) { staffChatUsers.push(u); seen.add(u.id); }
    }

    // Build tabs from approved speakers (already sorted by speaker_order)
    staffChatSpeakers = (approvedSpeakers ?? []).map((s) => {
      const su = s.users as unknown as { full_name: string | null; email: string };
      const so = s.orgs as unknown as { name: string } | null;
      return {
        requestId: s.id,
        label: so ? so.name : (su.full_name ?? su.email.split("@")[0]),
        sublabel: so ? (su.full_name ?? su.email.split("@")[0]) : undefined,
      };
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/orgs/${slug}`}
          className="text-sm text-gray-500 hover:text-brand"
        >
          ← {org.name}
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold">{meeting.title}</h1>
          {isOfficer && (
            <div className="shrink-0">
              <EditMeeting
                meetingId={meetingId}
                orgSlug={slug}
                title={meeting.title}
                startsAt={meeting.starts_at}
                endsAt={meeting.ends_at ?? null}
                location={meeting.location ?? null}
                agenda={meeting.agenda ?? null}
                slotsOpen={meeting.slots_open}
                slotLength={meeting.slot_length_minutes}
              />
            </div>
          )}
        </div>
        <div className="mt-2 text-gray-700 space-y-1 text-sm">
          <div>
            <strong>When:</strong> {new Date(meeting.starts_at).toLocaleString()}
            {meeting.ends_at &&
              ` – ${new Date(meeting.ends_at).toLocaleTimeString()}`}
          </div>
          {meeting.location && (
            <div>
              <strong>Where:</strong> {meeting.location}
            </div>
          )}
          <div>
            <strong>Speaker slots:</strong> {usedSlots} filled / {meeting.slots_open} open · {meeting.slot_length_minutes} min each
          </div>
        </div>
        {meeting.agenda && (
          <div className="mt-4 border-l-4 border-gray-200 pl-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Agenda</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{meeting.agenda}</p>
          </div>
        )}
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-3">Speaker lineup</h2>
        <SpeakerManage
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          speakers={(approvedSpeakers ?? []) as any}
          isOfficer={isOfficer}
          meetingId={meetingId}
          orgSlug={slug}
        />
      </section>

      {isOfficer && (
        <section>
          <h2 className="text-xl font-semibold mb-3">
            Pending requests
            {incoming && incoming.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({incoming.length})
              </span>
            )}
          </h2>
          <OfficerRequestList requests={incoming ?? []} />
        </section>
      )}

      {isOfficer && user && staffChatSpeakers.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Chat with speakers</h2>
          <StaffChat
            speakers={staffChatSpeakers}
            initialMessagesByRequest={staffChatMessages}
            users={staffChatUsers}
            currentUserId={user.id}
          />
        </section>
      )}

      {user && !isOfficer && inFuture && slotsRemaining > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Request a speaking slot</h2>
          {myExistingRequest ? (
            <div className="border border-gray-200 rounded-lg p-4 text-sm">
              You already have a{" "}
              <strong>{myExistingRequest.status}</strong> request for this meeting.{" "}
              <Link href={`/requests/${myExistingRequest.id}`} className="text-brand hover:underline">
                View request →
              </Link>
            </div>
          ) : (
            <SpeakRequestForm
              meetingId={meetingId}
              orgSlug={slug}
              maxMinutes={meeting.slot_length_minutes}
              myOrgs={
                (myOrgs?.map((m) => m.orgs as unknown as { id: string; name: string }) ?? []).filter(
                  (o) => o?.id !== meeting.org_id
                )
              }
            />
          )}
        </section>
      )}

      {user && !isOfficer && inFuture && (slotsRemaining === 0 || onWaitlist) && !myExistingRequest && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Waitlist</h2>
          <WaitlistButton
            meetingId={meetingId}
            orgSlug={slug}
            onWaitlist={onWaitlist}
            waitlistCount={waitlistCount}
            maxMinutes={meeting.slot_length_minutes}
            myOrgs={
              (myOrgs?.map((m) => m.orgs as unknown as { id: string; name: string }) ?? []).filter(
                (o) => o?.id !== meeting.org_id
              )
            }
          />
        </section>
      )}

      {!inFuture && (
        <p className="text-sm text-gray-500">This meeting is in the past.</p>
      )}
    </div>
  );
}
