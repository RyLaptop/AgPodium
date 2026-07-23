import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpeakRequestForm } from "./_request-form";
import { OfficerRequestList } from "./_officer-list";

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
        .select("role")
        .eq("org_id", meeting.org_id)
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const isOfficer =
    myMembership?.role === "officer" || myMembership?.role === "director";

  const [{ data: approvedSpeakers }, { data: incoming }, { data: myOrgs }] =
    await Promise.all([
      supabase
        .from("speak_requests")
        .select(
          "id, pitch, requested_minutes, status, users(full_name, email), orgs(name, slug)"
        )
        .eq("meeting_id", meetingId)
        .in("status", ["approved", "completed"]),
      isOfficer
        ? supabase
            .from("speak_requests")
            .select(
              "id, pitch, requested_minutes, status, created_at, users(full_name, email), orgs(name, slug)"
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
        : Promise.resolve({ data: [] }),
    ]);

  const usedSlots = approvedSpeakers?.length ?? 0;
  const slotsRemaining = Math.max(0, meeting.slots_open - usedSlots);
  const inFuture = new Date(meeting.starts_at) > new Date();

  // Has the current user already requested this meeting?
  const { data: myExistingRequest } = user
    ? await supabase
        .from("speak_requests")
        .select("id, status")
        .eq("meeting_id", meetingId)
        .eq("requester_user_id", user.id)
        .in("status", ["pending", "approved"])
        .maybeSingle()
    : { data: null };

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/orgs/${slug}`}
          className="text-sm text-gray-500 hover:text-brand"
        >
          ← {org.name}
        </Link>
        <h1 className="text-3xl font-bold mt-2">{meeting.title}</h1>
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
        <h2 className="text-xl font-semibold mb-3">Approved speakers</h2>
        {!approvedSpeakers || approvedSpeakers.length === 0 ? (
          <p className="text-gray-500 text-sm">None yet.</p>
        ) : (
          <ul className="space-y-2">
            {approvedSpeakers.map((s) => {
              const speaker = s.users as unknown as {
                full_name: string | null;
                email: string;
              };
              const speakerOrg = s.orgs as unknown as {
                name: string;
              } | null;
              return (
                <li
                  key={s.id}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {speaker.full_name ?? speaker.email.split("@")[0]}
                        {speakerOrg && (
                          <span className="text-gray-500 font-normal">
                            {" "}
                            · {speakerOrg.name}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{s.pitch}</p>
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 ml-3">
                      {s.requested_minutes} min · {s.status}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
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

      {user && !isOfficer && inFuture && slotsRemaining > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Request a speaking slot</h2>
          {myExistingRequest ? (
            <div className="border border-gray-200 rounded-lg p-4 text-sm">
              You already have a{" "}
              <strong>{myExistingRequest.status}</strong> request for this
              meeting.{" "}
              <Link
                href={`/requests/${myExistingRequest.id}`}
                className="text-brand hover:underline"
              >
                View request →
              </Link>
            </div>
          ) : (
            <SpeakRequestForm
              meetingId={meetingId}
              orgSlug={slug}
              maxMinutes={meeting.slot_length_minutes}
              myOrgs={
                (myOrgs?.map((m) => m.orgs as unknown as { id: string; name: string }) ??
                  []).filter((o) => o?.id !== meeting.org_id)
              }
            />
          )}
        </section>
      )}

      {!inFuture && (
        <p className="text-sm text-gray-500">This meeting is in the past.</p>
      )}
      {inFuture && slotsRemaining === 0 && !isOfficer && (
        <p className="text-sm text-gray-500">No speaker slots remaining.</p>
      )}
    </div>
  );
}
