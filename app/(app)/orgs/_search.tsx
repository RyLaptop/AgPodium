"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Org = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  member_count: number;
};

export function OrgSearch({ orgs }: { orgs: Org[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return orgs;
    return orgs.filter(
      (o) =>
        o.name.toLowerCase().includes(needle) ||
        o.slug.toLowerCase().includes(needle) ||
        (o.description ?? "").toLowerCase().includes(needle)
    );
  }, [q, orgs]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search orgs..."
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
      />

      {filtered.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-600">
          {orgs.length === 0
            ? "No orgs yet. Be the first to create one."
            : "No orgs match that search."}
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orgs/${o.slug}`}
                className="block border border-gray-200 rounded-lg p-4 hover:border-brand hover:shadow transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold">{o.name}</h3>
                  <span className="text-xs text-gray-500">
                    {o.member_count} member{o.member_count === 1 ? "" : "s"}
                  </span>
                </div>
                {o.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {o.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
