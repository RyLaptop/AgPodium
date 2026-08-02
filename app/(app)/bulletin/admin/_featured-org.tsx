"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setFeaturedOrg } from "../../orgs/actions";

export function FeaturedOrgPicker({
  currentFeaturedId,
  orgs,
}: {
  currentFeaturedId: string | null;
  orgs: { id: string; name: string }[];
}) {
  const [selectedId, setSelectedId] = useState(currentFeaturedId ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const currentOrg = orgs.find((o) => o.id === currentFeaturedId);

  const handleSave = () => {
    startTransition(async () => {
      const res = await setFeaturedOrg(selectedId || null);
      if (!res.ok) setError(res.error);
      else { setError(null); router.refresh(); }
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      {currentOrg ? (
        <p className="text-sm text-gray-600">
          Currently featured: <strong>{currentOrg.name}</strong>
        </p>
      ) : (
        <p className="text-sm text-gray-400">No org currently featured.</p>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
        >
          <option value="">— Clear featured org —</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <button
          onClick={handleSave}
          disabled={pending}
          className="px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
