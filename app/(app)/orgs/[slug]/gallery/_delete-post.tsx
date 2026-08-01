"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteOrgPost } from "./actions";

export function DeletePostButton({ postId, orgId, orgSlug }: { postId: string; orgId: string; orgSlug: string }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!confirm) {
    return (
      <button onClick={() => setConfirm(true)} className="text-xs text-red-400 hover:text-red-600">
        Delete
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        onClick={() => startTransition(async () => {
          const res = await deleteOrgPost(postId, orgId, orgSlug);
          if (!res.ok) { setError(res.error); setConfirm(false); return; }
          router.refresh();
        })}
        disabled={pending}
        className="text-xs text-red-600 font-medium disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Confirm delete"}
      </button>
      <button onClick={() => setConfirm(false)} className="text-xs text-gray-400 hover:text-gray-600">
        Cancel
      </button>
    </span>
  );
}
