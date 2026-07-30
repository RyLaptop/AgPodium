"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cancelBulletinPost } from "./actions";

type Props = {
  postId: string;
  title: string;
  description: string | null;
  eventAt: string;
  location: string | null;
  redirectAfterDelete?: string;
};

export function PostActions({ postId, redirectAfterDelete }: Props) {
  const [pendingCancel, startCancel] = useTransition();
  const router = useRouter();

  const handleCancel = () => {
    if (!confirm("Remove this event from the bulletin board?")) return;
    startCancel(async () => {
      const res = await cancelBulletinPost(postId);
      if (!res.ok) alert(res.error);
      else if (redirectAfterDelete) router.push(redirectAfterDelete);
      else router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <Link
        href={`/bulletin/${postId}/edit`}
        className="p-1 text-gray-400 hover:text-brand transition rounded"
        title="Edit event"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </Link>
      <button
        onClick={handleCancel}
        disabled={pendingCancel}
        title="Remove event"
        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 transition rounded disabled:opacity-40"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
