"use client";

import { useActionState } from "react";
import {
  createSpeakRequest,
  type CreateRequestResult,
} from "@/app/(app)/requests/actions";

export function SpeakRequestForm({
  meetingId,
  orgSlug,
  maxMinutes,
  myOrgs,
}: {
  meetingId: string;
  orgSlug: string;
  maxMinutes: number;
  myOrgs: { id: string; name: string }[];
}) {
  const action = createSpeakRequest.bind(null, meetingId, orgSlug);
  const [state, formAction, pending] = useActionState<
    CreateRequestResult | null,
    FormData
  >(action, null);

  return (
    <form action={formAction} className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium">Speaking on behalf of</span>
        <select
          name="requester_org_id"
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

      <label className="block">
        <span className="text-sm font-medium">Your pitch</span>
        <textarea
          name="pitch"
          required
          minLength={5}
          maxLength={500}
          rows={3}
          placeholder="What are you announcing? Why should their members care?"
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Minutes requested</span>
        <input
          type="number"
          name="requested_minutes"
          defaultValue={Math.min(2, maxMinutes)}
          min={1}
          max={maxMinutes}
          className="mt-1 w-32 px-3 py-2 border border-gray-300 rounded-lg"
        />
        <span className="text-xs text-gray-500 mt-1 block">
          Meeting default: {maxMinutes} min per slot.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send request"}
      </button>

      {state && !state.ok && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
