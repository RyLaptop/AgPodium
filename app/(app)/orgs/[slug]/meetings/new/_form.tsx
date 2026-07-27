"use client";

import { useActionState, useState } from "react";
import { createMeeting, type CreateMeetingResult } from "../actions";

export function NewMeetingForm({
  orgId,
  orgSlug,
  allOrgs,
}: {
  orgId: string;
  orgSlug: string;
  allOrgs: { id: string; name: string }[];
}) {
  const action = createMeeting.bind(null, orgId, orgSlug);
  const [state, formAction, pending] = useActionState<CreateMeetingResult | null, FormData>(action, null);
  const [repeatType, setRepeatType] = useState("none");
  const [cohostIds, setCohostIds] = useState<string[]>([]);
  const [cohostSearch, setCohostSearch] = useState("");
  const [showCohostSearch, setShowCohostSearch] = useState(false);

  const selectedCohosts = allOrgs.filter((o) => cohostIds.includes(o.id));
  const cohostCandidates = allOrgs.filter(
    (o) => !cohostIds.includes(o.id) && o.name.toLowerCase().includes(cohostSearch.toLowerCase())
  );

  const addCohost = (id: string) => {
    setCohostIds((prev) => [...prev, id]);
    setCohostSearch("");
  };

  const removeCohost = (id: string) => {
    setCohostIds((prev) => prev.filter((x) => x !== id));
  };

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Title</span>
        <input
          name="title"
          required
          minLength={2}
          maxLength={120}
          placeholder="General body meeting"
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Start</span>
          <input
            type="datetime-local"
            name="starts_at"
            required
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">End (optional)</span>
          <input
            type="datetime-local"
            name="ends_at"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Location</span>
        <input
          name="location"
          maxLength={200}
          placeholder="MSC 2405"
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Agenda</span>
        <textarea
          name="agenda"
          rows={4}
          maxLength={2000}
          placeholder="What will you cover?"
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Speaker slots</span>
          <input
            type="number"
            name="slots_open"
            defaultValue={3}
            min={0}
            max={50}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Minutes per slot</span>
          <input
            type="number"
            name="slot_length_minutes"
            defaultValue={2}
            min={1}
            max={60}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Repeat</span>
          <select
            name="repeat_type"
            value={repeatType}
            onChange={(e) => setRepeatType(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-white"
          >
            <option value="none">No repeat</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        {repeatType !== "none" && (
          <label className="block">
            <span className="text-sm font-medium">Occurrences</span>
            <input
              type="number"
              name="repeat_count"
              defaultValue={8}
              min={2}
              max={52}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </label>
        )}
      </div>
      {repeatType !== "none" && (
        <p className="text-xs text-gray-500">
          Creates multiple meetings with the same settings. You&apos;ll be taken to the org page when done.
        </p>
      )}

      {/* Co-host orgs */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">Co-host orgs (optional)</span>
          <button
            type="button"
            onClick={() => setShowCohostSearch((v) => !v)}
            className="text-xs text-brand hover:underline"
          >
            {showCohostSearch ? "Close" : "+ Add co-host"}
          </button>
        </div>

        {selectedCohosts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedCohosts.map((o) => (
              <span key={o.id} className="flex items-center gap-1 text-xs px-2.5 py-1 bg-brand/10 text-brand rounded-full">
                {o.name}
                <button type="button" onClick={() => removeCohost(o.id)} className="hover:text-red-500 ml-0.5">✕</button>
                <input type="hidden" name="cohost_org_id" value={o.id} />
              </span>
            ))}
          </div>
        )}

        {showCohostSearch && (
          <div className="border border-gray-200 rounded-lg p-3 space-y-2">
            <input
              value={cohostSearch}
              onChange={(e) => setCohostSearch(e.target.value)}
              placeholder="Search orgs…"
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {cohostSearch && (
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {cohostCandidates.slice(0, 8).map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => addCohost(o.id)}
                      className="w-full text-left text-sm px-3 py-2 rounded hover:bg-gray-50 hover:text-brand"
                    >
                      {o.name}
                    </button>
                  </li>
                ))}
                {cohostCandidates.length === 0 && (
                  <li className="text-xs text-gray-400 px-3 py-2">No orgs found.</li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Creating…" : repeatType !== "none" ? "Create series" : "Create meeting"}
      </button>

      {state && !state.ok && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
