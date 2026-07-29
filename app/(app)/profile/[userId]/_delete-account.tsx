"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAccount } from "../actions";

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const confirm = () => {
    startTransition(async () => {
      const res = await deleteAccount();
      if (res.ok) router.push("/");
      else alert(res.error);
    });
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm text-red-500 hover:text-red-700 hover:underline"
      >
        Delete account
      </button>
    );
  }

  return (
    <div className="border border-red-200 rounded-lg p-4 bg-red-50 space-y-3 max-w-sm">
      <p className="text-sm font-medium text-red-800">
        This permanently deletes your account and all your data. This cannot be undone.
      </p>
      <div className="flex gap-2">
        <button
          onClick={confirm}
          disabled={pending}
          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Yes, delete my account"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-white disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
