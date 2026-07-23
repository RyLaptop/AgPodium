"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInvite } from "../../orgs/actions";

export function AcceptInviteButton({
  code,
  orgName,
  orgSlug,
}: {
  code: string;
  orgName: string;
  orgSlug: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    startTransition(async () => {
      const res = await acceptInvite(code);
      if (!res.ok) alert(res.error);
      else router.push(`/orgs/${orgSlug}`);
    });
  };

  return (
    <div className="text-center space-y-3">
      <button
        onClick={handleClick}
        disabled={pending}
        className="px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60 font-medium"
      >
        {pending ? "Joining…" : `Join ${orgName}`}
      </button>
    </div>
  );
}
