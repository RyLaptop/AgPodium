"use client";

import { useActionState } from "react";
import { sendHelpQuery, type ContactResult } from "../contact/actions";

export function HelpQueryForm() {
  const [state, action, pending] = useActionState<ContactResult | null, FormData>(
    sendHelpQuery,
    null
  );

  if (state?.ok) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-2">
        <p className="text-2xl">✓</p>
        <p className="font-semibold text-gray-900">Query submitted</p>
        <p className="text-sm text-gray-600">An admin will follow up with you soon.</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Describe your issue</span>
        <textarea
          name="question"
          required
          rows={5}
          maxLength={2000}
          placeholder="What do you need help with? Include as much detail as possible."
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-sm"
        />
      </label>

      {state && !state.ok && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="px-5 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60 transition text-sm font-medium"
      >
        {pending ? "Submitting…" : "Submit query"}
      </button>
    </form>
  );
}
