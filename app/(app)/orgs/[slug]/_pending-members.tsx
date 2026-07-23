"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveMember, denyMember } from "../actions";

type PendingMember = {
  user_id: string;
  full_name: string | null;
  email: string;
};

export function PendingMembers({
  orgId,
  members,
}: {
  orgId: string;
  members: PendingMember[];
}) {
  if (members.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">
        Join requests{" "}
        <span className="text-sm font-normal text-gray-500">
          ({members.length})
        </span>
      </h2>
      <ul className="space-y-2">
        {members.map((m) => (
          <PendingRow key={m.user_id} orgId={orgId} member={m} />
        ))}
      </ul>
    </section>
  );
}

function PendingRow({
  orgId,
  member,
}: {
  orgId: string;
  member: PendingMember;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handle = (action: "approve" | "deny") => {
    startTransition(async () => {
      const res =
        action === "approve"
          ? await approveMember(orgId, member.user_id)
          : await denyMember(orgId, member.user_id);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  return (
    <li className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
      <div>
        <p className="font-medium">
          {member.full_name ?? member.email.split("@")[0]}
        </p>
        <p className="text-xs text-gray-500">{member.email}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handle("approve")}
          disabled={pending}
          className="text-sm px-3 py-1.5 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60"
        >
          Approve
        </button>
        <button
          onClick={() => handle("deny")}
          disabled={pending}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60"
        >
          Deny
        </button>
      </div>
    </li>
  );
}
