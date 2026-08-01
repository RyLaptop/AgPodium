"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

async function toggleRsvp(meetingId: string, hasRsvp: boolean) {
  const res = await fetch("/api/rsvp", {
    method: hasRsvp ? "DELETE" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meetingId }),
  });
  return res.ok;
}

export function RsvpButton({
  meetingId,
  hasRsvp,
  count,
}: {
  meetingId: string;
  hasRsvp: boolean;
  count: number;
}) {
  const [optimisticRsvp, setOptimisticRsvp] = useState(hasRsvp);
  const [optimisticCount, setOptimisticCount] = useState(count);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = () => {
    const next = !optimisticRsvp;
    setOptimisticRsvp(next);
    setOptimisticCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      await toggleRsvp(meetingId, optimisticRsvp);
      router.refresh();
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition disabled:opacity-60 ${
        optimisticRsvp
          ? "bg-brand text-white border-brand hover:bg-brand-dark"
          : "border-gray-300 hover:border-brand hover:text-brand"
      }`}
    >
      {optimisticRsvp ? "✓ RSVP'd" : "RSVP"}
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${optimisticRsvp ? "bg-white/20" : "bg-gray-100"}`}>
        {optimisticCount}
      </span>
    </button>
  );
}
