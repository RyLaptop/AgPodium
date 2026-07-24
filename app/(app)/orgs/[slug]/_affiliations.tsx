"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addAffiliation, removeAffiliation } from "../actions";

type AffiliatedOrg = { id: string; slug: string; name: string };
type SearchableOrg = { id: string; slug: string; name: string };

export function Affiliations({
  orgId,
  orgSlug,
  affiliated,
  allOrgs,
  isDirector,
}: {
  orgId: string;
  orgSlug: string;
  affiliated: AffiliatedOrg[];
  allOrgs: SearchableOrg[];
  isDirector: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  const affiliatedIds = new Set(affiliated.map((a) => a.id));
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

  const remove = (affiliateOrgId: string, name: string) => {
    if (!confirm(`Remove affiliation with ${name}?`)) return;
    startTransition(async () => {
      const res = await removeAffiliation(orgId, orgSlug, affiliateOrgId);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  if (affiliated.length === 0 && !isDirector) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Affiliated orgs</h2>
        {isDirector && (
          <button
            onClick={() => setAdding((v) => !v)}
            className="text-xs text-brand hover:underline"
          >
            {adding ? "Cancel" : "+ Add affiliation"}
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

      {affiliated.length === 0 ? (
        isDirector ? (
          <p className="text-sm text-gray-400 italic">No affiliated orgs yet.</p>
        ) : null
      ) : (
        <div className="flex flex-wrap gap-2">
          {affiliated.map((a) => (
            <div key={a.id} className="flex items-center gap-1">
              <Link
                href={`/orgs/${a.slug}`}
                className="text-sm px-3 py-1.5 border border-gray-200 rounded-full hover:border-brand hover:text-brand transition"
              >
                {a.name}
              </Link>
              {isDirector && (
                <button
                  onClick={() => remove(a.id, a.name)}
                  disabled={pending}
                  className="text-gray-300 hover:text-red-400 transition disabled:opacity-40"
                  title="Remove affiliation"
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
