"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearBulletinPost } from "./actions";

export function ClearBulletinPost({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const res = await clearBulletinPost(id);
          if (!res.ok && res.error) alert(res.error);
          else router.refresh();
        })
      }
      disabled={pending}
      aria-label="Clear"
      className="shrink-0 text-gray-400 hover:text-red-500 disabled:opacity-40 text-lg leading-none"
    >
      ×
    </button>
  );
}
