"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { promoteMember, removeMember } from "../actions";

type ActiveMember = {
  user_id: string;
  full_name: string | null;
  email: string;
  role: string;
};

export function ActiveMembers({
  orgId,
  members,
  currentUserId,
}: {
  orgId: string;
  members: ActiveMember[];
  currentUserId?: string;
}) {
  if (members.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Members</h2>
      <ul className="space-y-2">
        {members.map((m) => (
          <MemberRow key={m.user_id} orgId={orgId} member={m} isSelf={m.user_id === currentUserId} />
        ))}
      </ul>
    </section>
  );
}

function MemberRow({ orgId, member, isSelf }: { orgId: string; member: ActiveMember; isSelf: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const promote = () => {
    startTransition(async () => {
      const res = await promoteMember(orgId, member.user_id);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  const remove = () => {
    if (!confirm(`Remove ${member.full_name ?? member.email.split("@")[0]} from the org?`)) return;
    startTransition(async () => {
      const res = await removeMember(orgId, member.user_id);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  const roleLabel =
    member.role === "director" ? "STAFF" : member.role === "officer" ? "Officer" : "Member";

  return (
    <li className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
      <div>
        <Link href={`/profile/${member.user_id}`} className="font-medium hover:text-brand hover:underline">
          {member.full_name ?? member.email.split("@")[0]}
        </Link>
        <p className="text-xs text-gray-500">{member.email}</p>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            member.role === "director"
              ? "bg-maroon-100 text-maroon-700 font-medium"
              : member.role === "officer"
              ? "bg-gray-100 text-gray-600"
              : "bg-gray-50 text-gray-500"
          }`}
        >
          {roleLabel}
        </span>
        {member.role !== "director" && (
          <button
            onClick={promote}
            disabled={pending}
            className="text-xs px-2.5 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60"
          >
            Make STAFF
          </button>
        )}
        {member.role !== "director" && !isSelf && (
          <button
            onClick={remove}
            disabled={pending}
            title="Remove from org"
            className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </li>
  );
}
