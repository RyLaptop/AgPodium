"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { tagPill, tagLabel, TAG_COLORS } from "./_tag-colors";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

type Org = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  member_count: number;
  tags: string[];
  logo_url: string | null;
  next_meeting_at: string | null;
  next_meeting_day: number | null;
};

export function OrgSearch({ orgs }: { orgs: Org[] }) {
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sizeFilter, setSizeFilter] = useState<"any" | "small" | "medium" | "large">("any");
  const [meetingThisWeek, setMeetingThisWeek] = useState(false);
  const [dayFilter, setDayFilter] = useState<number | null>(null);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    orgs.forEach((o) => o.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [orgs]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const now = Date.now();
    return orgs.filter((o) => {
      if (activeTag && !o.tags.includes(activeTag)) return false;
      if (needle && !o.name.toLowerCase().includes(needle)) return false;
      if (sizeFilter === "small" && o.member_count > 15) return false;
      if (sizeFilter === "medium" && (o.member_count <= 15 || o.member_count > 50)) return false;
      if (sizeFilter === "large" && o.member_count <= 50) return false;
      if (meetingThisWeek) {
        if (!o.next_meeting_at) return false;
        const diff = new Date(o.next_meeting_at).getTime() - now;
        if (diff < 0 || diff > ONE_WEEK) return false;
      }
      if (dayFilter !== null && o.next_meeting_day !== dayFilter) return false;
      return true;
    });
  }, [q, activeTag, sizeFilter, meetingThisWeek, dayFilter, orgs]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search orgs..."
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
      />

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 items-center text-sm">
        <span className="text-gray-500 text-xs font-medium">Size:</span>
        {(["any", "small", "medium", "large"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSizeFilter(s)}
            className={`px-2.5 py-1 rounded-full border text-xs transition ${
              sizeFilter === s ? "bg-brand text-white border-brand" : "border-gray-300 text-gray-600 hover:border-brand"
            }`}
          >
            {s === "any" ? "Any size" : s === "small" ? "≤15" : s === "medium" ? "16–50" : "50+"}
          </button>
        ))}

        <span className="text-gray-300 mx-1">|</span>

        <button
          onClick={() => setMeetingThisWeek((v) => !v)}
          className={`px-2.5 py-1 rounded-full border text-xs transition ${
            meetingThisWeek ? "bg-brand text-white border-brand" : "border-gray-300 text-gray-600 hover:border-brand"
          }`}
        >
          Meeting this week
        </button>

        <span className="text-gray-300 mx-1">|</span>

        <span className="text-gray-500 text-xs font-medium">Day:</span>
        {DAYS.map((day, i) => (
          <button
            key={day}
            onClick={() => setDayFilter(dayFilter === i ? null : i)}
            className={`px-2.5 py-1 rounded-full border text-xs transition ${
              dayFilter === i ? "bg-brand text-white border-brand" : "border-gray-300 text-gray-600 hover:border-brand"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

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
            : "No orgs match those filters."}
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orgs/${o.slug}`}
                className="flex flex-col border border-gray-200 rounded-lg p-4 hover:border-brand hover:shadow transition h-full"
              >
                <div className="flex items-center gap-3 mb-2">
                  {o.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={o.logo_url}
                      alt={o.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                      <span className="text-brand font-bold text-sm">{o.name[0]}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{o.name}</h3>
                    <span className="text-xs text-gray-500">
                      {o.member_count} member{o.member_count === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                {o.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 flex-1">{o.description}</p>
                )}
                {o.next_meeting_at && (
                  <p className="text-xs text-green-700 mt-2 font-medium">
                    Next: {new Date(o.next_meeting_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                )}
                {o.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {o.tags.map((tag) => (
                      <span key={tag} className={`text-xs px-1.5 py-0.5 rounded ${tagPill(tag)}`}>
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
