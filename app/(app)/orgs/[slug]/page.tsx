import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { tagPill, tagLabel } from "../_tag-colors";
import { InviteLink } from "./_invite-link";
import { JoinLeaveButton } from "./_join-leave";
import { PendingMembers } from "./_pending-members";
import { ActiveMembers } from "./_active-members";
import { EditOrgForm } from "./_edit-org";

export const dynamic = "force-dynamic";

export default async function OrgProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: org } = await supabase
    .from("orgs")
    .select("id, slug, name, description, created_at, tags")
    .eq("slug", slug)
    .single();

  if (!org) notFound();

  const svc = createServiceClient();
  const [{ data: members }, { data: meetings }, { data: myMembership }, { data: existingInvite }] =
    await Promise.all([
      supabase
        .from("org_members")
        .select("role, status, users(id, full_name, email)")
        .eq("org_id", org.id),
      supabase
        .from("meetings")
        .select("id, title, starts_at, location, slots_open")
        .eq("org_id", org.id)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(10),
      user
        ? supabase
            .from("org_members")
            .select("role, status")
            .eq("org_id", org.id)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      svc.from("org_invites").select("id, code").eq("org_id", org.id).maybeSingle(),
    ]);

  // Count approved/completed speakers per meeting
  const meetingIds = (meetings ?? []).map((m) => m.id);
  const { data: approvedRows } = meetingIds.length > 0
    ? await svc
        .from("speak_requests")
        .select("meeting_id")
        .in("meeting_id", meetingIds)
        .in("status", ["approved", "completed"])
    : { data: [] };

  const approvedByMeeting = new Map<string, number>();
  for (const row of approvedRows ?? []) {
    approvedByMeeting.set(row.meeting_id, (approvedByMeeting.get(row.meeting_id) ?? 0) + 1);
  }

  const activeMembers = members?.filter((m) => m.status === "active") ?? [];
  const pendingMembers = members?.filter((m) => m.status === "pending") ?? [];

  const staff = activeMembers
    .filter((m) => m.role === "director")
    .map((m) => m.users as unknown as { id: string; full_name: string | null; email: string });

  const memberCount = activeMembers.length;
  const myRole = myMembership?.role as "member" | "officer" | "director" | undefined;
  const myStatus = myMembership?.status as "active" | "pending" | undefined;
  const isPending = myStatus === "pending";
  const isMember = !!myRole && myStatus === "active";
  const isDirector = isMember && myRole === "director";
  const canManage = isMember && (myRole === "director" || myRole === "officer");

  const pendingForDirector = canManage && myRole === "director"
    ? pendingMembers.map((m) => {
        const u = m.users as unknown as { id: string; full_name: string | null; email: string };
        return { user_id: u.id, full_name: u.full_name, email: u.email };
      })
    : [];

  const activeMembersForDirector = isDirector
    ? activeMembers.map((m) => {
        const u = m.users as unknown as { id: string; full_name: string | null; email: string };
        return { user_id: u.id, full_name: u.full_name, email: u.email, role: m.role };
      })
    : [];

  const tags = (org.tags as unknown as string[]) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <Link href="/orgs" className="text-sm text-gray-500 hover:text-brand">
          ← Orgs
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{org.name}</h1>
            {org.description && (
              <p className="text-gray-700 mt-2 max-w-2xl">{org.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              {memberCount} member{memberCount === 1 ? "" : "s"}
              {staff.length > 0 && (
                <>
                  {" · staff: "}
                  {staff.map((d, i) => (
                    <span key={d.id}>
                      {i > 0 && ", "}
                      <Link href={`/profile/${d.id}`} className="hover:text-brand hover:underline">
                        {d.full_name ?? d.email.split("@")[0]}
                      </Link>
                    </span>
                  ))}
                </>
              )}
            </p>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-xs px-2 py-0.5 rounded-full ${tagPill(tag)}`}
                  >
                    {tagLabel(tag)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <JoinLeaveButton
              orgId={org.id}
              isMember={isMember}
              isPending={isPending}
              isDirector={isDirector}
            />
            {canManage && (
              <Link
                href={`/orgs/${org.slug}/meetings/new`}
                className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-center hover:bg-gray-50"
              >
                + New meeting
              </Link>
            )}
          </div>
        </div>

        {isDirector && (
          <div className="mt-4 space-y-3">
            <EditOrgForm
              orgId={org.id}
              orgSlug={org.slug}
              currentName={org.name}
              currentDescription={org.description}
              currentTags={tags}
            />
            <InviteLink
              orgId={org.id}
              orgSlug={org.slug}
              existingCode={existingInvite?.code ?? null}
            />
          </div>
        )}
      </div>

      {pendingForDirector.length > 0 && (
        <PendingMembers orgId={org.id} members={pendingForDirector} />
      )}

      {activeMembersForDirector.length > 0 && (
        <ActiveMembers orgId={org.id} members={activeMembersForDirector} currentUserId={user?.id} />
      )}

      <section>
        <h2 className="text-xl font-semibold mb-3">Upcoming meetings</h2>
        {!meetings || meetings.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-600 text-sm">
            No meetings scheduled.
            {canManage && " Officers or STAFF can add one."}
          </div>
        ) : (
          <ul className="space-y-2">
            {meetings.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/orgs/${org.slug}/meetings/${m.id}`}
                  className="block border border-gray-200 rounded-lg p-4 hover:border-brand transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{m.title}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(m.starts_at).toLocaleString()}
                        {m.location && ` · ${m.location}`}
                      </p>
                    </div>
                    <div className="text-sm">
                      {(() => {
                        const remaining = Math.max(0, m.slots_open - (approvedByMeeting.get(m.id) ?? 0));
                        return remaining === 0
                          ? <span className="text-red-500 font-medium">Full</span>
                          : <span className="text-gray-500">{remaining} slot{remaining === 1 ? "" : "s"} open</span>;
                      })()}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
