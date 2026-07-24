"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveOrg, rejectOrg } from "@/app/(app)/orgs/actions";
import { tagLabel } from "@/app/(app)/orgs/_tag-colors";

type PendingOrg = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tags: string[];
  created_at: string;
  founder_name: string | null;
  founder_email: string;
};

export function OrgApprovalQueue({ orgs }: { orgs: PendingOrg[] }) {
  if (orgs.length === 0) return <p className="text-gray-500 text-sm">No pending org requests.</p>;

  return (
    <ul className="space-y-3">
      {orgs.map((o) => <OrgRow key={o.id} org={o} />)}
    </ul>
  );
}

function OrgRow({ org }: { org: PendingOrg }) {
  const [pending, startTransition] = useTransition();
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const router = useRouter();

  const approve = () => {
    startTransition(async () => {
      const res = await approveOrg(org.id);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  const reject = () => {
    startTransition(async () => {
      const res = await rejectOrg(org.id, rejectReason);
      if (!res.ok) alert(res.error);
      else { setRejecting(false); router.refresh(); }
    });
  };

  return (
    <li className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{org.name}</p>
          <p className="text-xs text-gray-500">/{org.slug} · by {org.founder_name ?? org.founder_email}</p>
          {org.description && <p className="text-sm text-gray-600 mt-1">{org.description}</p>}
          {org.tags.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">{org.tags.map(tagLabel).join(", ")}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">Submitted {new Date(org.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={approve} disabled={pending}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-60">
            Approve
          </button>
          <button onClick={() => setRejecting((v) => !v)} disabled={pending}
            className="px-3 py-1.5 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 disabled:opacity-60">
            Reject
          </button>
        </div>
      </div>

      {rejecting && (
        <div className="flex gap-2 items-center">
          <input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button onClick={reject} disabled={pending}
            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-60">
            Confirm
          </button>
          <button onClick={() => setRejecting(false)}
            className="px-2 py-1.5 text-gray-500 text-sm hover:text-gray-700">
            Cancel
          </button>
        </div>
      )}
    </li>
  );
}
