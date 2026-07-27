"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondDm } from "@/app/(app)/messages/actions";

export function DmRequestActions({ threadId }: { threadId: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<"accepted" | "declined" | null>(null);
  const router = useRouter();

  if (done) {
    return (
      <span className={`text-xs px-2 py-0.5 rounded ${done === "accepted" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
        {done}
      </span>
    );
  }

  const act = (accept: boolean) => {
    startTransition(async () => {
      await respondDm(threadId, accept);
      setDone(accept ? "accepted" : "declined");
      router.refresh();
    });
  };

  return (
    <div className="flex gap-1.5 shrink-0">
      <button
        onClick={() => act(true)}
        disabled={pending}
        className="text-xs px-2.5 py-1 bg-brand text-white rounded-md hover:bg-brand-dark disabled:opacity-50 transition"
      >
        Accept
      </button>
      <button
        onClick={() => act(false)}
        disabled={pending}
        className="text-xs px-2.5 py-1 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-50 transition"
      >
        Decline
      </button>
    </div>
  );
}
