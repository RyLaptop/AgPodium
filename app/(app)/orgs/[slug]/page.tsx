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
import { Affiliations } from "./_affiliations";
import { CohostInvites } from "./_cohost-invites";
import { AuthGatedLink } from "@/app/(app)/_auth-gate";

export const dynamic = "force-dynamic";

export default async function OrgProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const svc = createServiceClient();
  const { data: org } = await svc
    .from("orgs")
    .select("id, slug, name, description, created_at, tags, logo_url, status, contact_email, website_url, tiktok_url, instagram_url")
    .eq("slug", slug)
    .single();

  if (!org) notFound();

  // Pending orgs only visible to the founder (director) or admins
  const { data: myMembership } = user
    ? await supabase.from("org_members").select("role, status").eq("org_id", org.id).eq("user_id", user.id).maybeSingle()
    : { data: null };

  const { data: profile } = user
    ? await supabase.from("users").select("is_site_admin").eq("id", user.id).single()
    : { data: null };

  if (org.status === "pending" && myMembership?.role !== "director" && !profile?.is_site_admin) {
    notFound();
  }

  const [{ data: members }, { data: meetings }, { data: existingInvite }, { data: affiliatedRows }, { data: allOrgs }, { data: cohostInviteRows }] =
    await Promise.all([
      svc.from("org_members").select("role, status, title, users(id, full_name, email)").eq("org_id", org.id),
      svc.from("meetings")
        .select("id, title, starts_at, location, slots_open, cancelled_at")
        .eq("org_id", org.id)
        .gte("starts_at", new Date().toISOString())
        .is("cancelled_at", null)
        .order("starts_at", { ascending: true })
        .limit(52),
      svc.from("org_invites").select("id, code").eq("org_id", org.id).maybeSingle(),
      svc.from("org_affiliations")
        .select("id, org_id, affiliate_org_id, status, requester_org:orgs!org_affiliations_org_id_fkey(id, slug, name), target_org:orgs!org_affiliations_affiliate_org_id_fkey(id, slug, name)")
        .or(`org_id.eq.${org.id},affiliate_org_id.eq.${org.id}`)
        .neq("status", "declined"),
      svc.from("orgs").select("id, slug, name").eq("status", "approved").order("name"),
      svc.from("meeting_cohosts")
        .select("id, meeting_id, meetings(id, title, starts_at, orgs(name, slug))")
        .eq("org_id", org.id)
        .eq("status", "pending"),
    ]);

  const meetingIds = (meetings ?? []).map((m) => m.id);
  const { data: approvedRows } = meetingIds.length > 0
    ? await svc.from("speak_requests").select("meeting_id")
        .in("meeting_id", meetingIds).in("status", ["approved", "completed"])
    : { data: [] };

  const approvedByMeeting = new Map<string, number>();
  for (const row of approvedRows ?? []) {
    approvedByMeeting.set(row.meeting_id, (approvedByMeeting.get(row.meeting_id) ?? 0) + 1);
  }

  const activeMembers = (members ?? []).filter((m) => m.status === "active");
  const pendingMembers = (members ?? []).filter((m) => m.status === "pending");

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
        return { user_id: u.id, full_name: u.full_name, email: u.email, role: m.role, title: (m as unknown as { title: string | null }).title ?? null };
      })
    : [];

  const tags = (org.tags as unknown as string[]) ?? [];

  type AffiliationRow = {
    id: string;
    status: "pending" | "accepted" | "declined";
    isOutgoing: boolean;
    org: { id: string; slug: string; name: string };
  };

  const affiliationRows: AffiliationRow[] = (affiliatedRows ?? []).map((r) => {
    const row = r as unknown as {
      id: string; org_id: string; affiliate_org_id: string; status: string;
      requester_org: { id: string; slug: string; name: string };
      target_org: { id: string; slug: string; name: string };
    };
    const isOutgoing = row.org_id === org.id;
    return {
      id: row.id,
      status: row.status as "pending" | "accepted" | "declined",
      isOutgoing,
      org: isOutgoing ? row.target_org : row.requester_org,
    };
  });

  const allOrgsList = (allOrgs ?? []).filter((o) => o.id !== org.id).map((o) => ({ id: o.id, slug: o.slug, name: o.name }));

  type CohostInvite = {
    id: string;
    meetingId: string;
    meetingTitle: string;
    startsAt: string;
    hostOrg: { name: string; slug: string };
  };

  const cohostInvites: CohostInvite[] = (cohostInviteRows ?? []).map((r) => {
    const row = r as unknown as {
      id: string;
      meeting_id: string;
      meetings: { id: string; title: string; starts_at: string; orgs: { name: string; slug: string } };
    };
    return {
      id: row.id,
      meetingId: row.meeting_id,
      meetingTitle: row.meetings.title,
      startsAt: row.meetings.starts_at,
      hostOrg: row.meetings.orgs,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <Link href="/orgs" className="text-sm text-gray-500 hover:text-brand">← Orgs</Link>

        {org.status === "pending" && (
          <div className="mt-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            ⏳ This org is pending admin approval.
          </div>
        )}

        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {org.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logo_url}
                alt={org.name}
                className="w-16 h-16 rounded-full object-cover border border-gray-200 shrink-0"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">{org.name}</h1>
              {org.description && (
                <p className="text-gray-700 mt-2 max-w-2xl">{org.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {memberCount} member{memberCount === 1 ? "" : "s"}
                {staff.length > 0 && (
                  <> · staff: {staff.map((d, i) => (
                    <span key={d.id}>
                      {i > 0 && ", "}
                      <Link href={`/profile/${d.id}`} className="hover:text-brand hover:underline">
                        {d.full_name ?? d.email.split("@")[0]}
                      </Link>
                    </span>
                  ))}</>
                )}
              </p>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag) => (
                    <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${tagPill(tag)}`}>
                      {tagLabel(tag)}
                    </span>
                  ))}
                </div>
              )}
              {(() => {
                const o = org as unknown as { website_url?: string | null; tiktok_url?: string | null; instagram_url?: string | null };
                const ensureProtocol = (url: string) =>
                  /^https?:\/\//i.test(url) ? url : `https://${url}`;
                const links = [
                  o.website_url ? { href: ensureProtocol(o.website_url), label: "Website" } : null,
                  o.tiktok_url ? { href: ensureProtocol(o.tiktok_url), label: "TikTok" } : null,
                  o.instagram_url ? { href: ensureProtocol(o.instagram_url), label: "Instagram" } : null,
                ].filter(Boolean) as { href: string; label: string }[];
                return links.length > 0 ? (
                  <div className="flex flex-wrap gap-3 mt-2">
                    {links.map((l) => (
                      <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-brand hover:underline">
                        {l.label} ↗
                      </a>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <JoinLeaveButton orgId={org.id} isMember={isMember} isPending={isPending} isDirector={isDirector} />
            {canManage && (
              <AuthGatedLink
                href={`/orgs/${org.slug}/meetings/new`}
                className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-center hover:bg-gray-50"
              >
                + New meeting
              </AuthGatedLink>
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
              currentLogoUrl={org.logo_url}
              currentContactEmail={(org as unknown as { contact_email?: string | null }).contact_email ?? null}
              currentWebsiteUrl={(org as unknown as { website_url?: string | null }).website_url ?? null}
              currentTiktokUrl={(org as unknown as { tiktok_url?: string | null }).tiktok_url ?? null}
              currentInstagramUrl={(org as unknown as { instagram_url?: string | null }).instagram_url ?? null}
            />
            <InviteLink orgId={org.id} orgSlug={org.slug} existingCode={existingInvite?.code ?? null} />
          </div>
        )}
      </div>

      <Affiliations
        orgId={org.id}
        orgSlug={org.slug}
        affiliations={affiliationRows}
        allOrgs={allOrgsList}
        isDirector={isDirector || (myMembership?.role === "officer" && myMembership?.status === "active")}
      />

      {canManage && cohostInvites.length > 0 && (
        <CohostInvites invites={cohostInvites} orgSlug={org.slug} />
      )}

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
            No meetings scheduled.{canManage && " Officers or STAFF can add one."}
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
