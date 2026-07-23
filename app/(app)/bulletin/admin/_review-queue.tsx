"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewBulletinPost } from "../actions";

type Post = {
  id: string;
  event_title: string;
  event_description: string | null;
  event_at: string;
  event_location: string | null;
  created_at: string;
  users: unknown; // { full_name, email }
  orgs: unknown; // { name } | null
};

export function ReviewQueue({ posts }: { posts: Post[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (posts.length === 0) {
    return <p className="text-gray-500 text-sm">Nothing pending review.</p>;
  }

  const handle = (id: string, decision: "approved" | "denied") => {
    startTransition(async () => {
      const res = await reviewBulletinPost(id, decision);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  return (
    <ul className="space-y-3">
      {posts.map((p) => {
        const submitter = p.users as { full_name: string | null; email: string };
        const org = p.orgs as { name: string } | null;
        return (
          <li key={p.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium">{p.event_title}</p>
              <span className="text-xs text-gray-500">
                {new Date(p.event_at).toLocaleString()}
              </span>
            </div>
            {p.event_description && (
              <p className="text-sm text-gray-600">{p.event_description}</p>
            )}
            <p className="text-xs text-gray-500">
              {p.event_location ?? "No location"} · submitted by{" "}
              {submitter.full_name ?? submitter.email}
              {org && ` (${org.name})`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handle(p.id, "approved")}
                disabled={pending}
                className="px-3 py-1 text-sm bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60"
              >
                Approve
              </button>
              <button
                onClick={() => handle(p.id, "denied")}
                disabled={pending}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60"
              >
                Deny
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
