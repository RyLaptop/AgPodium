"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideRequest } from "@/app/(app)/requests/actions";

type Req = {
  id: string;
  pitch: string;
  requested_minutes: number;
  status: string;
  created_at: string;
  users: unknown; // { full_name, email }
  orgs: unknown; // { name, slug } | null
};

export function OfficerRequestList({ requests }: { requests: Req[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (requests.length === 0) {
    return <p className="text-gray-500 text-sm">No pending requests.</p>;
  }

  const handleDecide = (id: string, decision: "approved" | "denied") => {
    startTransition(async () => {
      const res = await decideRequest(id, decision);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  return (
    <ul className="space-y-2">
      {requests.map((r) => {
        const speaker = r.users as { full_name: string | null; email: string };
        const org = r.orgs as { name: string; slug: string } | null;
        return (
          <li
            key={r.id}
            className="border border-gray-200 rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {speaker.full_name ?? speaker.email.split("@")[0]}
                  {org && (
                    <span className="text-gray-500 font-normal">
                      {" "}
                      · {org.name}
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-600 mt-1">{r.pitch}</p>
              </div>
              <span className="text-xs text-gray-500 shrink-0">
                {r.requested_minutes} min
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDecide(r.id, "approved")}
                disabled={pending}
                className="px-3 py-1 text-sm bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60"
              >
                Approve
              </button>
              <button
                onClick={() => handleDecide(r.id, "denied")}
                disabled={pending}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60"
              >
                Deny
              </button>
              <Link
                href={`/requests/${r.id}`}
                className="px-3 py-1 text-sm text-brand hover:underline ml-auto"
              >
                Open →
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
