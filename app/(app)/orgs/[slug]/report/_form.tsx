"use client";

import { useState, useTransition } from "react";
import { submitReport } from "./actions";

export function ReportForm({ orgId }: { orgId: string }) {
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      setError(null);
      const res = await submitReport(orgId, content);
      if (!res.ok) { setError(res.error); return; }
      setSubmitted(true);
    });
  };

  if (submitted) return (
    <div className="border border-green-200 bg-green-50 rounded-xl p-6 text-center">
      <p className="text-green-700 font-semibold">Report submitted anonymously.</p>
      <p className="text-sm text-green-600 mt-1">Thank you for helping keep the community safe.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <textarea
        rows={6}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Describe the incident or concern…"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={submit}
        disabled={pending || !content.trim()}
        className="px-5 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit anonymously"}
      </button>
    </div>
  );
}
