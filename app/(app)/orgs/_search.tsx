"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { tagPill, tagLabel, TAG_COLORS } from "./_tag-colors";

type Org = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  member_count: number;
  tags: string[];
};

export function OrgSearch({ orgs }: { orgs: Org[] }) {
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    orgs.forEach((o) => o.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [orgs]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return orgs.filter((o) => {
      if (activeTag && !o.tags.includes(activeTag)) return false;
      if (!needle) return true;
      return (
        o.name.toLowerCase().includes(needle) ||
        o.slug.toLowerCase().includes(needle) ||
        (o.description ?? "").toLowerCase().includes(needle)
      );
    });
  }, [q, activeTag, orgs]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search orgs..."
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
      />

      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`text-xs px-3 py-1 rounded-full border transition ${
                activeTag === tag
                  ? (TAG_COLORS[tag]?.active ?? "bg-brand text-white border-brand")
                  : (TAG_COLORS[tag]?.border ?? "border-gray-300 text-gray-600 hover:border-brand hover:text-brand")
              }`}
            >
              {tagLabel(tag)}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-600">
          {orgs.length === 0
            ? "No orgs yet. Be the first to create one."
            : "No orgs match that filter."}
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orgs/${o.slug}`}
                className="block border border-gray-200 rounded-lg p-4 hover:border-brand hover:shadow transition h-full"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold">{o.name}</h3>
                  <span className="text-xs text-gray-500">
                    {o.member_count} member{o.member_count === 1 ? "" : "s"}
                  </span>
                </div>
                {o.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{o.description}</p>
                )}
                {o.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {o.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-xs px-1.5 py-0.5 rounded ${tagPill(tag)}`}
                      >
                        {tagLabel(tag)}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
