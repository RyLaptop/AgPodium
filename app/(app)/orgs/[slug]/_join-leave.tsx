"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinOrg, leaveOrg, stepDownFromRole } from "../actions";
import { useAuthGate } from "@/app/(app)/_auth-gate";

export function JoinLeaveButton({
  orgId,
  isMember,
  isPending,
  isDirector,
  myRole,
}: {
  orgId: string;
  isMember: boolean;
  isPending: boolean;
  isDirector: boolean;
  myRole?: "member" | "officer" | "director" | null;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { isAuthed, open } = useAuthGate();

  const handleLeave = (confirmMsg: string) => {
    if (!confirm(confirmMsg)) return;
    startTransition(async () => {
      const res = await leaveOrg(orgId);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  const handleStepDown = () => {
    if (!confirm("Step down to regular member? You'll keep your membership but lose your staff role.")) return;
    startTransition(async () => {
      const res = await stepDownFromRole(orgId);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  if (isDirector) {
    const canStepDown = myRole === "director";
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm px-3 py-1.5 bg-brand/10 text-brand-dark font-medium rounded-lg">
          STAFF
        </span>
        {canStepDown && (
          <button
            onClick={handleStepDown}
            disabled={pending}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60"
          >
            {pending ? "…" : "Step down"}
          </button>
        )}
        <button
          onClick={() => handleLeave("Leave this org? You'll lose STAFF access.")}
          disabled={pending}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60"
        >
          {pending ? "…" : "Leave org"}
        </button>
      </div>
    );
  }

  if (isMember && myRole === "officer") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg">Officer</span>
        <button
          onClick={handleStepDown}
          disabled={pending}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60"
        >
          {pending ? "…" : "Step down"}
        </button>
        <button
          onClick={() => handleLeave("Leave this org?")}
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
    if (!isAuthed) { open(); return; }
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
