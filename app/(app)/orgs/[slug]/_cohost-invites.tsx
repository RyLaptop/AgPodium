"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { respondCohost } from "./meetings/actions";

type CohostInvite = {
  id: string;
  meetingId: string;
  meetingTitle: string;
  startsAt: string;
  hostOrg: { name: string; slug: string };
};

export function CohostInvites({
  invites,
  orgSlug,
}: {
  invites: CohostInvite[];
  orgSlug: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const respond = (invite: CohostInvite, accept: boolean) => {
    startTransition(async () => {
      const res = await respondCohost(invite.id, invite.meetingId, invite.hostOrg.slug, accept);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  return (
    <section>
      <h2 className="text-lg font-semibold mb-2">Co-host invites</h2>
      <div className="space-y-2">
        {invites.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between border border-yellow-200 bg-yellow-50 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium">
                <Link href={`/orgs/${inv.hostOrg.slug}/meetings/${inv.meetingId}`} className="hover:text-brand hover:underline">
                  {inv.meetingTitle}
                </Link>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {inv.hostOrg.name} · {new Date(inv.startsAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2 shrink-0 ml-4">
              <button
                onClick={() => respond(inv, true)}
                disabled={pending}
                className="text-xs px-2.5 py-1 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60"
              >
                Accept
              </button>
              <button
                onClick={() => respond(inv, false)}
                disabled={pending}
                className="text-xs px-2.5 py-1 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-60"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
