import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { FeedbackForm } from "./_feedback";
import { MakeRequest } from "./_make-request";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return (
    <div className="flex flex-col items-center justify-center py-24 text-center text-gray-500 gap-3">
      <p className="text-lg font-medium text-gray-700">Sign in to view your requests</p>
      <p className="text-sm">To access this feature you must be signed in.</p>
      <div className="flex gap-3 mt-2">
        <Link href="/login" className="px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark transition">Sign in</Link>
        <Link href="/signup" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">Create account</Link>
      </div>
    </div>
  );

  const svc = createServiceClient();
  const [{ data: allOrgs }, { data: myOrgMemberships }] = await Promise.all([
    svc.from("orgs").select("id, name, slug").eq("status", "approved").order("name"),
    supabase.from("org_members").select("org_id, orgs(id, name)")
      .eq("user_id", user.id).eq("status", "active").in("role", ["officer", "director"]),
  ]);

  const myOrgs = (myOrgMemberships ?? []).map((m) => {
    const o = m.orgs as unknown as { id: string; name: string } | null;
    return o ? { id: o.id, name: o.name } : null;
  }).filter(Boolean) as { id: string; name: string }[];

  const [{ data: mine }, { data: incoming }] = await Promise.all([
    supabase
      .from("speak_requests")
      .select(
        "id, pitch, status, requested_minutes, created_at, speaker_feedback_at, meetings(id, title, starts_at, orgs(name, slug))"
      )
      .eq("requester_user_id", user.id)
      .in("status", ["pending", "waitlisted", "approved", "denied", "disputed", "completed"])
      .order("created_at", { ascending: false }),
    // RLS returns rows the officer can see across orgs they officer/direct
    supabase
      .from("speak_requests")
      .select(
        "id, pitch, status, requested_minutes, created_at, users!speak_requests_requester_user_id_fkey(full_name, email), orgs!speak_requests_requester_org_id_fkey(name), meetings(id, title, starts_at, org_id, orgs(name, slug))"
      )
      .neq("requester_user_id", user.id)
      .in("status", ["pending", "approved", "disputed"])
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Requests</h1>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">My requests</h2>
          <MakeRequest
            allOrgs={(allOrgs ?? []).map((o) => ({ id: o.id, name: o.name, slug: o.slug }))}
            myOrgs={myOrgs}
          />
        </div>
        {(() => {
          const active = (mine ?? []).filter((r) => {
            if (r.status !== "completed") return true;
            if (r.speaker_feedback_at) return false;
            const meeting = r.meetings as unknown as { starts_at: string };
            return Date.now() < new Date(meeting.starts_at).getTime() + 24 * 60 * 60 * 1000;
          });
          const done: typeof mine = [];

          if (active.length === 0 && done.length === 0) {
            return (
              <p className="text-gray-500 text-sm">
                You haven&apos;t requested any speaking slots yet.{" "}
                <Link href="/orgs" className="text-brand hover:underline">
                  Browse orgs →
                </Link>
              </p>
            );
          }

          return (
            <div className="space-y-6">
              {active.length > 0 && (
                <ul className="space-y-2">
                  {active.map((r) => {
                    const meeting = r.meetings as unknown as {
                      id: string; title: string; starts_at: string;
                      orgs: { name: string; slug: string };
                    };
                    const needsFeedback = r.status === "completed" && !r.speaker_feedback_at;
                    return (
                      <li key={r.id}>
                        <div className="border border-gray-200 rounded-lg p-3 hover:border-brand">
                          <Link href={`/requests/${r.id}`} className="block">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-medium truncate">{meeting.orgs.name} · {meeting.title}</p>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-1">{r.pitch}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(meeting.starts_at).toLocaleString()}
                                </p>
                              </div>
                              <StatusPill status={r.status} />
                            </div>
                          </Link>
                          {needsFeedback && <FeedbackForm requestId={r.id} />}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

            </div>
          );
        })()}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Incoming (from your orgs)</h2>
        {!incoming || incoming.length === 0 ? (
          <p className="text-gray-500 text-sm">Nothing to review.</p>
        ) : (
          <ul className="space-y-2">
            {incoming.map((r) => {
              const meeting = r.meetings as unknown as {
                id: string;
                title: string;
                starts_at: string;
                orgs: { name: string; slug: string };
              };
              const speaker = r.users as unknown as {
                full_name: string | null;
                email: string;
              };
              const speakerOrg = r.orgs as unknown as { name: string } | null;
              const speakerLabel = speakerOrg?.name ?? speaker.full_name ?? speaker.email.split("@")[0];
              const speakerSub = speakerOrg ? (speaker.full_name ?? speaker.email.split("@")[0]) : null;
              return (
                <li key={r.id}>
                  <Link
                    href={`/requests/${r.id}`}
                    className="block border border-gray-200 rounded-lg p-3 hover:border-brand"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {speakerLabel} → {meeting.orgs.name} · {meeting.title}
                        </p>
                        {speakerSub && (
                          <p className="text-xs text-gray-500">{speakerSub}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                          {r.pitch}
                        </p>
                      </div>
                      <StatusPill status={r.status} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    waitlisted: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-800",
    denied: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
    no_show: "bg-gray-200 text-gray-700",
    cancelled: "bg-gray-100 text-gray-500",
    disputed: "bg-orange-100 text-orange-800",
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
