"use client";

import { useState, useTransition } from "react";
import { sendTestEmail } from "./actions";

export function TestEmailButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const run = () => {
    setResult(null);
    startTransition(async () => {
      const res = await sendTestEmail();
      setResult(res);
    });
  };

  return (
    <div className="flex items-start gap-3 flex-wrap">
      <button
        onClick={run}
        disabled={pending}
        className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
      >
        {pending ? "Sending…" : "Send test email to myself"}
      </button>
      {result && (
        <p className={`text-sm mt-0.5 ${result.ok ? "text-green-700" : "text-red-600"}`}>
          {result.ok ? "✓" : "✗"} {result.message}
        </p>
      )}
    </div>
  );
}
