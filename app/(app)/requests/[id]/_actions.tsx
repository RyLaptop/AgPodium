"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelRequest,
  decideRequest,
  markCompleted,
  markNoShow,
} from "../actions";

export function RequestActions({
  requestId,
  status,
  isRequester,
  isOfficer,
  meetingInPast,
}: {
  requestId: string;
  status: string;
  isRequester: boolean;
  isOfficer: boolean;
  meetingInPast: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok && res.error) alert(res.error);
      else router.refresh();
    });
  };

  const buttons: React.ReactNode[] = [];

  if (isOfficer && status === "pending") {
    buttons.push(
      <Btn key="a" onClick={() => run(() => decideRequest(requestId, "approved"))} primary disabled={pending}>
        Approve
      </Btn>,
      <Btn key="d" onClick={() => run(() => decideRequest(requestId, "denied"))} disabled={pending}>
        Deny
      </Btn>
    );
  }
  if (isOfficer && status === "approved" && meetingInPast) {
    buttons.push(
      <Btn key="c" onClick={() => run(() => markCompleted(requestId))} primary disabled={pending}>
        Mark completed
      </Btn>,
      <Btn key="n" onClick={() => run(() => markNoShow(requestId))} disabled={pending}>
        No-show
      </Btn>
    );
  }
  if (isRequester && status === "pending") {
    buttons.push(
      <Btn key="x" onClick={() => run(() => cancelRequest(requestId))} disabled={pending}>
        Cancel my request
      </Btn>
    );
  }

  if (buttons.length === 0) return null;

  return <div className="flex flex-wrap gap-2">{buttons}</div>;
}

function Btn({
  children,
  onClick,
  primary,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        primary
          ? "px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60"
          : "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60"
      }
    >
      {children}
    </button>
  );
}
