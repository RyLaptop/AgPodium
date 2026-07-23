"use client";

import { useState, useTransition } from "react";
import { generateInvite, deleteInvite } from "../actions";

export function InviteLink({
  orgId,
  orgSlug,
  existingCode,
}: {
  orgId: string;
  orgSlug: string;
  existingCode: string | null;
}) {
  const [code, setCode] = useState<string | null>(existingCode);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const inviteUrl = code
    ? (typeof window !== "undefined" ? window.location.origin : "") + `/invite/${code}`
    : null;

  const handleGenerate = () => {
    startTransition(async () => {
      const res = await generateInvite(orgId, orgSlug);
      if (!res.ok) alert(res.error);
      else { setCode(res.code); setExistingId(res.inviteId); }
    });
  };

  const handleRevoke = () => {
    if (!existingId) return;
    startTransition(async () => {
      const res = await deleteInvite(existingId, orgSlug);
      if (!res.ok) alert(res.error);
      else { setCode(null); setExistingId(null); }
    });
  };

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Invite link</h3>
        {code ? (
          <button
            onClick={handleRevoke}
            disabled={pending}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            Revoke
          </button>
        ) : null}
      </div>

      {code ? (
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1.5 truncate">
            /invite/{code}
          </code>
          <button
            onClick={handleCopy}
            className="text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 shrink-0"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={pending}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60"
        >
          {pending ? "Generating…" : "Generate invite link"}
        </button>
      )}
      <p className="text-xs text-gray-400">
        Anyone with this link can join the org directly without approval.
      </p>
    </div>
  );
}
