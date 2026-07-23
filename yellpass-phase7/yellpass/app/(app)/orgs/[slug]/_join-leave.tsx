"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinOrg, leaveOrg } from "../actions";

export function JoinLeaveButton({
  orgId,
  isMember,
  isDirector,
}: {
  orgId: string;
  isMember: boolean;
  isDirector: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

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

  if (isDirector) {
    return (
      <button
        disabled
        title="Directors can't leave; transfer or delete the org first"
        className="text-sm px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
      >
        Director
      </button>
    );
  }

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
