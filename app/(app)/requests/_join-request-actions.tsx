"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveMember, denyMember } from "@/app/(app)/orgs/actions";

export function JoinRequestActions({ orgId, userId }: { orgId: string; userId: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<"approved" | "denied" | null>(null);
  const router = useRouter();

  if (done) {
    return (
      <span className={`text-xs px-2 py-0.5 rounded ${done === "approved" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
        {done}
      </span>
    );
  }

  const act = (approve: boolean) => {
    startTransition(async () => {
      if (approve) await approveMember(orgId, userId);
      else await denyMember(orgId, userId);
      setDone(approve ? "approved" : "denied");
      router.refresh();
    });
  };

  return (
    <div className="flex gap-1.5 shrink-0">
      <button
        onClick={() => act(true)}
        disabled={pending}
        className="text-xs px-2.5 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition"
      >
        Approve
      </button>
      <button
        onClick={() => act(false)}
        disabled={pending}
        className="text-xs px-2.5 py-1 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-50 transition"
      >
        Deny
      </button>
    </div>
  );
}
