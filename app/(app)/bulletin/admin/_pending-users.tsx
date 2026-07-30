"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveUser, denyUser } from "./actions";

type PendingUser = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
};

export function PendingUsers({ users }: { users: PendingUser[] }) {
  return (
    <ul className="space-y-2">
      {users.map((u) => (
        <PendingUserRow key={u.id} user={u} />
      ))}
    </ul>
  );
}

function PendingUserRow({ user }: { user: PendingUser }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handle = (action: "approve" | "deny") => {
    if (action === "deny" && !confirm(`Delete ${user.full_name ?? user.email}? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = action === "approve" ? await approveUser(user.id) : await denyUser(user.id);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  return (
    <li className="border border-yellow-200 bg-yellow-50 rounded-lg p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{user.full_name ?? <span className="italic text-gray-400">No name</span>}</p>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
        <p className="text-xs text-gray-400">Signed up {new Date(user.created_at).toLocaleDateString()}</p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={() => handle("approve")}
          disabled={pending}
          className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
        >
          Approve
        </button>
        <button
          onClick={() => handle("deny")}
          disabled={pending}
          className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60"
        >
          Deny
        </button>
      </div>
    </li>
  );
}
