import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RequestActions } from "./_actions";
import { Chat, type ChatMessage, type ChatUser } from "./_chat";

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: req } = await supabase
    .from("speak_requests")
    .select(
      `id, pitch, status, requested_minutes, created_at, decided_at,
       requester_user_id,
       meeting_id,
       users(full_name, email),
       orgs(name, slug),
       meetings(id, title, starts_at, location, org_id, orgs(name, slug))`
    )
    .eq("id", id)
    .single();

  if (!req) notFound();

  const meeting = req.meetings as unknown as {
    id: string;
    title: string;
    starts_at: string;
    location: string | null;
    org_id: string;
    orgs: { name: string; slug: string };
  };
  const speaker = req.users as unknown as {
    full_name: string | null;
    email: string;
  };
  const speakerOrg = req.orgs as unknown as { name: string; slug: string } | null;

  const isRequester = user?.id === req.requester_user_id;

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

  const meetingInPast = new Date(meeting.starts_at) < new Date();

  // Load chat (only if the caller can access it — RLS enforces)
  const canChat = user && (isRequester || isOfficer);
  const [{ data: chatRows }, { data: officerRows }] = canChat
    ? await Promise.all([
        supabase
          .from("chat_messages")
          .select("id, speak_request_id, user_id, body, created_at")
          .eq("speak_request_id", req.id)
          .order("created_at", { ascending: true }),
        // Officers of the target org (for name resolution in the chat)
        supabase
          .from("org_members")
          .select("users(id, full_name, email)")
          .eq("org_id", meeting.org_id)
          .in("role", ["officer", "director"]),
      ])
    : [{ data: null }, { data: null }];

  const chatUsers: ChatUser[] = [];
  if (canChat) {
    // Speaker profile
    chatUsers.push({
      id: req.requester_user_id,
      full_name: speaker.full_name,
      email: speaker.email,
    });
    // Officer profiles
    (officerRows ?? []).forEach((row) => {
      const u = row.users as unknown as ChatUser;
      if (u && !chatUsers.some((x) => x.id === u.id)) chatUsers.push(u);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/requests"
          className="text-sm text-gray-500 hover:text-brand"
        >
          ← Requests
        </Link>
        <h1 className="text-3xl font-bold mt-2">Speaking request</h1>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Speaker</p>
            <p className="font-medium">
              {speaker.full_name ?? speaker.email.split("@")[0]}
              {speakerOrg && (
                <span className="text-gray-500 font-normal">
                  {" "}
                  · {speakerOrg.name}
                </span>
              )}
            </p>
          </div>
          <StatusPill status={req.status} />
        </div>

        <div>
          <p className="text-sm text-gray-500">Meeting</p>
          <Link
            href={`/orgs/${meeting.orgs.slug}/meetings/${meeting.id}`}
            className="font-medium text-brand hover:underline"
          >
            {meeting.orgs.name} · {meeting.title}
          </Link>
          <p className="text-sm text-gray-600">
            {new Date(meeting.starts_at).toLocaleString()}
            {meeting.location && ` · ${meeting.location}`}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Pitch</p>
          <p className="text-gray-800 whitespace-pre-wrap">{req.pitch}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Requested time</p>
          <p>{req.requested_minutes} min</p>
        </div>
      </div>

      <RequestActions
        requestId={req.id}
        status={req.status}
        isRequester={isRequester}
        isOfficer={isOfficer}
        meetingInPast={meetingInPast}
      />

      {canChat && user && (
        <section>
          <Chat
            requestId={req.id}
            currentUserId={user.id}
            initialMessages={(chatRows ?? []) as ChatMessage[]}
            users={chatUsers}
          />
        </section>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    denied: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
    no_show: "bg-gray-200 text-gray-700",
    cancelled: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded ${
        styles[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
