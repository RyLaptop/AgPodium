"use client";

import { useActionState } from "react";
import {
  submitBulletinPost,
  type SubmitBulletinResult,
} from "../actions";

export function SubmitBulletinForm({
  myOrgs,
}: {
  myOrgs: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<
    SubmitBulletinResult | null,
    FormData
  >(submitBulletinPost, null);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Event title</span>
        <input
          name="event_title"
          required
          minLength={3}
          maxLength={150}
          placeholder="Big Event 2026"
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Description</span>
        <textarea
          name="event_description"
          rows={4}
          maxLength={1000}
          placeholder="What's happening?"
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Date & time</span>
        <input
          type="datetime-local"
          name="event_at"
          required
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Location</span>
        <input
          name="event_location"
          maxLength={200}
          placeholder="Rudder Plaza"
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      {myOrgs.length > 0 && (
        <label className="block">
          <span className="text-sm font-medium">Submitting on behalf of</span>
          <select
            name="org_id"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Just me (no org)</option>
            {myOrgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit for review"}
      </button>

      {state && !state.ok && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
