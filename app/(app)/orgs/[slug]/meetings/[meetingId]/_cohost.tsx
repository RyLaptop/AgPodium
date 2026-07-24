"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { inviteCohost, respondCohost } from "../actions";

type Cohost = {
  id: string;
  org_id: string;
  org_name: string;
  org_slug: string;
  status: "pending" | "accepted" | "declined";
};

type OrgOption = { id: string; slug: string; name: string };

export function CohostPanel({
  meetingId,
  orgSlug,
  cohosts,
  availableOrgs,
  isOfficer,
  myOrgId,
}: {
  meetingId: string;
  orgSlug: string;
  cohosts: Cohost[];
  availableOrgs: OrgOption[];
  isOfficer: boolean;
  myOrgId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [inviting, setInviting] = useState(false);
  const router = useRouter();

  const cohostOrgIds = new Set(cohosts.map((c) => c.org_id));
  const candidates = availableOrgs.filter(
    (o) => !cohostOrgIds.has(o.id) && o.name.toLowerCase().includes(search.toLowerCase())
  );

  const invite = (cohostOrgId: string) => {
    startTransition(async () => {
      const res = await inviteCohost(meetingId, orgSlug, cohostOrgId);
      if (!res.ok) alert(res.error);
      else { setInviting(false); setSearch(""); router.refresh(); }
    });
  };

  const respond = (cohostId: string, accept: boolean) => {
    startTransition(async () => {
      const res = await respondCohost(cohostId, meetingId, orgSlug, accept);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  const pendingInvite = myOrgId ? cohosts.find((c) => c.org_id === myOrgId && c.status === "pending") : null;

  if (cohosts.length === 0 && !isOfficer) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Co-hosts</h2>
        {isOfficer && (
          <button onClick={() => setInviting((v) => !v)} className="text-xs text-brand hover:underline">
            {inviting ? "Cancel" : "+ Invite org"}
          </button>
        )}
      </div>

      {pendingInvite && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
          <p className="font-medium text-yellow-800">Your org has been invited to co-host this meeting.</p>
          <div className="flex gap-2 mt-2">
            <button onClick={() => respond(pendingInvite.id, true)} disabled={pending}
              className="px-3 py-1 bg-brand text-white text-xs rounded-lg hover:bg-brand-dark disabled:opacity-60">
              Accept
            </button>
            <button onClick={() => respond(pendingInvite.id, false)} disabled={pending}
              className="px-3 py-1 border border-gray-300 text-xs rounded-lg hover:bg-gray-50 disabled:opacity-60">
              Decline
            </button>
          </div>
        </div>
      )}

      {inviting && (
        <div className="mb-3 border border-gray-200 rounded-lg p-3 space-y-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orgs to invite…"
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
          {search && (
            <ul className="space-y-1 max-h-36 overflow-y-auto">
              {candidates.slice(0, 6).map((o) => (
                <li key={o.id}>
                  <button onClick={() => invite(o.id)} disabled={pending}
                    className="w-full text-left text-sm px-3 py-1.5 rounded hover:bg-gray-50 hover:text-brand disabled:opacity-60">
                    {o.name}
                  </button>
                </li>
              ))}
              {candidates.length === 0 && <li className="text-xs text-gray-400 px-3 py-2">No orgs found.</li>}
            </ul>
          )}
        </div>
      )}

      {cohosts.length === 0 ? (
        isOfficer && <p className="text-sm text-gray-400 italic">No co-hosts yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {cohosts.map((c) => (
            <Link key={c.id} href={`/orgs/${c.org_slug}`}
              className={`text-sm px-3 py-1.5 border rounded-full transition ${
                c.status === "accepted" ? "border-brand/30 text-brand bg-brand/5" :
                c.status === "declined" ? "border-gray-200 text-gray-400 line-through" :
                "border-yellow-300 text-yellow-700 bg-yellow-50"
              }`}>
              {c.org_name}
              {c.status === "pending" && " (pending)"}
              {c.status === "declined" && " (declined)"}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
