"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addAffiliation, removeAffiliation, respondAffiliation } from "../actions";

type AffiliationRow = {
  id: string;
  status: "pending" | "accepted" | "declined";
  isOutgoing: boolean;
  org: { id: string; slug: string; name: string };
};

type SearchableOrg = { id: string; slug: string; name: string };

export function Affiliations({
  orgId,
  orgSlug,
  affiliations,
  allOrgs,
  isDirector,
}: {
  orgId: string;
  orgSlug: string;
  affiliations: AffiliationRow[];
  allOrgs: SearchableOrg[];
  isDirector: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  const accepted = affiliations.filter((a) => a.status === "accepted");
  const pendingIncoming = affiliations.filter((a) => a.status === "pending" && !a.isOutgoing);
  const pendingOutgoing = affiliations.filter((a) => a.status === "pending" && a.isOutgoing);

  const affiliatedIds = new Set(affiliations.map((a) => a.org.id));
  const candidates = allOrgs.filter(
    (o) => o.id !== orgId && !affiliatedIds.has(o.id) &&
      o.name.toLowerCase().includes(search.toLowerCase())
  );

  const add = (affiliateOrgId: string) => {
    startTransition(async () => {
      const res = await addAffiliation(orgId, orgSlug, affiliateOrgId);
      if (!res.ok) alert(res.error);
      else { setAdding(false); setSearch(""); router.refresh(); }
    });
  };

  const remove = (affiliationId: string, name: string) => {
    if (!confirm(`Remove affiliation with ${name}?`)) return;
    startTransition(async () => {
      const res = await removeAffiliation(affiliationId, orgSlug);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  const respond = (affiliationId: string, accept: boolean) => {
    startTransition(async () => {
      const res = await respondAffiliation(affiliationId, orgSlug, accept);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  const hasAnything = accepted.length > 0 || pendingIncoming.length > 0 || pendingOutgoing.length > 0;
  if (!hasAnything && !isDirector) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Affiliated orgs</h2>
        {isDirector && (
          <button
            onClick={() => setAdding((v) => !v)}
            className="text-xs text-brand hover:underline"
          >
            {adding ? "Cancel" : "+ Request affiliation"}
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-3 border border-gray-200 rounded-lg p-3 space-y-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orgs…"
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
          {search && (
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {candidates.slice(0, 8).map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => add(o.id)}
                    disabled={pending}
                    className="w-full text-left text-sm px-3 py-2 rounded hover:bg-gray-50 hover:text-brand disabled:opacity-60"
                  >
                    {o.name}
                  </button>
                </li>
              ))}
              {candidates.length === 0 && (
                <li className="text-xs text-gray-400 px-3 py-2">No orgs found.</li>
              )}
            </ul>
          )}
        </div>
      )}

      {pendingIncoming.length > 0 && isDirector && (
        <div className="mb-3 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Incoming requests</p>
          {pendingIncoming.map((a) => (
            <div key={a.id} className="flex items-center justify-between border border-yellow-200 bg-yellow-50 rounded-lg px-3 py-2">
              <Link href={`/orgs/${a.org.slug}`} className="text-sm font-medium hover:text-brand">
                {a.org.name}
              </Link>
              <div className="flex gap-2">
                <button
                  onClick={() => respond(a.id, true)}
                  disabled={pending}
                  className="text-xs px-2.5 py-1 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60"
                >
                  Accept
                </button>
                <button
                  onClick={() => respond(a.id, false)}
                  disabled={pending}
                  className="text-xs px-2.5 py-1 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-60"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {accepted.length === 0 && pendingOutgoing.length === 0 ? (
        isDirector ? (
          <p className="text-sm text-gray-400 italic">No affiliated orgs yet.</p>
        ) : null
      ) : (
        <div className="flex flex-wrap gap-2">
          {accepted.map((a) => (
            <div key={a.id} className="flex items-center gap-1">
              <Link
                href={`/orgs/${a.org.slug}`}
                className="text-sm px-3 py-1.5 border border-gray-200 rounded-full hover:border-brand hover:text-brand transition"
              >
                {a.org.name}
              </Link>
              {isDirector && (
                <button
                  onClick={() => remove(a.id, a.org.name)}
                  disabled={pending}
                  className="text-gray-300 hover:text-red-400 transition disabled:opacity-40"
                  title="Remove affiliation"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {pendingOutgoing.map((a) => (
            <div key={a.id} className="flex items-center gap-1">
              <span className="text-sm px-3 py-1.5 border border-dashed border-gray-300 rounded-full text-gray-400">
                {a.org.name} <span className="text-xs">(pending)</span>
              </span>
              {isDirector && (
                <button
                  onClick={() => remove(a.id, a.org.name)}
                  disabled={pending}
                  className="text-gray-300 hover:text-red-400 transition disabled:opacity-40"
                  title="Cancel request"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
