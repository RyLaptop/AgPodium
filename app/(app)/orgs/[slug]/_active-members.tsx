"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { promoteMember, demoteMember, removeMember, setMemberTitle } from "../actions";

type ActiveMember = {
  user_id: string;
  full_name: string | null;
  email: string;
  role: string;
  title: string | null;
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
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(member.title ?? "");
  const router = useRouter();

  const promote = () => {
    startTransition(async () => {
      const res = await promoteMember(orgId, member.user_id);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  const demote = () => {
    if (!confirm(`Remove staff status from ${member.full_name ?? member.email.split("@")[0]}? They'll become a regular member.`)) return;
    startTransition(async () => {
      const res = await demoteMember(orgId, member.user_id);
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

  const saveTitle = () => {
    startTransition(async () => {
      const res = await setMemberTitle(orgId, member.user_id, titleInput);
      if (!res.ok) alert(res.error);
      else { setEditingTitle(false); router.refresh(); }
    });
  };

  const roleLabel =
    member.role === "director" ? "STAFF" : member.role === "officer" ? "Officer" : "Member";

  return (
    <li className="border border-gray-200 rounded-lg px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/profile/${member.user_id}`} className="font-medium hover:text-brand hover:underline">
            {member.full_name ?? member.email.split("@")[0]}
          </Link>
          {member.title && (
            <p className="text-xs text-brand font-medium">{member.title}</p>
          )}
          <p className="text-xs text-gray-500">{member.email}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <span className={`text-xs px-2 py-0.5 rounded ${
            member.role === "director" ? "bg-brand/10 text-brand-dark font-medium"
            : member.role === "officer" ? "bg-gray-100 text-gray-600"
            : "bg-gray-50 text-gray-500"
          }`}>
            {roleLabel}
          </span>
          <button
            onClick={() => setEditingTitle((v) => !v)}
            className="text-xs px-2 py-0.5 border border-gray-200 rounded hover:bg-gray-50 text-gray-500"
            title="Set title"
          >
            🏷️
          </button>
          {member.role === "officer" && (
            <button onClick={demote} disabled={pending}
              className="text-xs px-2.5 py-1 border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 disabled:opacity-60">
              Remove staff
            </button>
          )}
          {member.role === "member" && (
            <button onClick={promote} disabled={pending}
              className="text-xs px-2.5 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60">
              Make STAFF
            </button>
          )}
          {member.role !== "director" && !isSelf && (
            <button onClick={remove} disabled={pending} title="Remove from org"
              className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {editingTitle && (
        <div className="flex gap-2 items-center">
          <input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="e.g. President, Social Chair…"
            maxLength={40}
            className="flex-1 text-xs px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button onClick={saveTitle} disabled={pending}
            className="text-xs px-2.5 py-1.5 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60">
            Save
          </button>
          <button onClick={() => setEditingTitle(false)}
            className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
            Cancel
          </button>
        </div>
      )}
    </li>
  );
}
