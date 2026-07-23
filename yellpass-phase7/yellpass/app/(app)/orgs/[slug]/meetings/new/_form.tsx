"use client";

import { useActionState } from "react";
import {
  createMeeting,
  type CreateMeetingResult,
} from "../actions";

export function NewMeetingForm({
  orgId,
  orgSlug,
}: {
  orgId: string;
  orgSlug: string;
}) {
  const action = createMeeting.bind(null, orgId, orgSlug);
  const [state, formAction, pending] = useActionState<
    CreateMeetingResult | null,
    FormData
  >(action, null);

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

      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create meeting"}
      </button>

      {state && !state.ok && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
