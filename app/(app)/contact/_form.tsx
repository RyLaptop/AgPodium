"use client";

import { useActionState } from "react";
import { sendContactMessage, type ContactResult } from "./actions";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactResult | null, FormData>(
    sendContactMessage,
    null
  );

  if (state?.ok) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-2">
        <p className="text-2xl">✓</p>
        <p className="font-semibold text-gray-900">Message sent</p>
        <p className="text-sm text-gray-600">An admin will get back to you soon.</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Subject</span>
        <input
          name="subject"
          required
          maxLength={150}
          placeholder="What's this about?"
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-sm"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Message</span>
        <textarea
          name="body"
          required
          rows={6}
          maxLength={2000}
          placeholder="Describe your question or issue…"
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
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
