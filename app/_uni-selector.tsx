"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UNIVERSITIES, type University } from "@/lib/university-data";

const UNI_LIST = Object.entries(UNIVERSITIES) as [University, typeof UNIVERSITIES[University]][];

export function UniSelector() {
  const [selected, setSelected] = useState<University | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const filtered = search.trim()
    ? UNI_LIST.filter(([, u]) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.label.toLowerCase().includes(search.toLowerCase()) ||
        u.shortName.toLowerCase().includes(search.toLowerCase())
      )
    : UNI_LIST;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    document.cookie = `uni=${selected}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    router.push("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search your university…"
        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />

      <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
        {filtered.map(([key, uni]) => {
          const isSelected = selected === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              style={{
                backgroundColor: uni.primary,
                color: uni.secondary,
                outline: isSelected ? `3px solid ${uni.secondary}` : undefined,
                outlineOffset: isSelected ? "2px" : undefined,
              }}
              className={`relative px-3 py-3 rounded-xl text-left transition-all ${
                isSelected ? "ring-2 ring-offset-1" : "hover:opacity-90"
              }`}
            >
              <p className="font-bold text-sm leading-tight">{uni.label}</p>
              <p className="text-xs opacity-75 leading-tight mt-0.5 truncate">{uni.shortName}</p>
              {isSelected && (
                <span className="absolute top-1.5 right-2 text-xs font-bold" style={{ color: uni.secondary }}>✓</span>
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-2 text-center text-sm text-gray-400 py-4">No match found</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!selected || loading}
        className="w-full py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:opacity-40 transition"
      >
        {loading ? "Loading…" : selected ? `Continue as ${UNIVERSITIES[selected].label} →` : "Select a university to continue"}
      </button>
    </form>
  );
}
