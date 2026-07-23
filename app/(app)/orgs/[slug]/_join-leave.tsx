"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinOrg, leaveOrg } from "../actions";

export function JoinLeaveButton({
  orgId,
  isMember,
  isPending,
  isDirector,
}: {
  orgId: string;
  isMember: boolean;
  isPending: boolean;
  isDirector: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (isDirector) {
    const handleLeave = () => {
      if (!confirm("Leave this org? You'll lose STAFF access.")) return;
      startTransition(async () => {
        const res = await leaveOrg(orgId);
        if (!res.ok) alert(res.error);
        else router.refresh();
      });
    };

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm px-3 py-1.5 bg-maroon-100 text-maroon-700 font-medium rounded-lg">
          STAFF
        </span>
        <button
          onClick={handleLeave}
          disabled={pending}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60"
        >
          {pending ? "…" : "Leave org"}
        </button>
      </div>
    );
  }

  if (isPending) {
    return (
      <span className="text-sm px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg">
        Request pending
      </span>
    );
  }

  const handleClick = () => {
    startTransition(async () => {
      const res = isMember ? await leaveOrg(orgId) : await joinOrg(orgId);
      if (!res.ok) {
        alert(res.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={
        isMember
          ? "text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60"
          : "text-sm px-3 py-1.5 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60"
      }
    >
      {pending ? "…" : isMember ? "Leave org" : "Join"}
    </button>
  );
}
