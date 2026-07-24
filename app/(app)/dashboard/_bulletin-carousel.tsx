"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Post = {
  id: string;
  event_title: string;
  event_description: string | null;
  event_at: string;
  event_location: string | null;
  org_name: string | null;
};

export function BulletinCarousel({ posts }: { posts: Post[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (posts.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % posts.length), 5000);
    return () => clearInterval(t);
  }, [posts.length]);

  if (posts.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">No upcoming bulletin events.</p>
    );
  }

  const post = posts[idx];

  return (
    <div className="relative bg-gradient-to-r from-brand/5 to-brand/10 border border-brand/20 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-brand uppercase tracking-wide mb-1">
            {post.org_name ? `${post.org_name} · ` : ""}
            {new Date(post.event_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            {" · "}
            {new Date(post.event_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </p>
          <p className="font-semibold text-gray-900 truncate">{post.event_title}</p>
          {post.event_description && (
            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{post.event_description}</p>
          )}
          {post.event_location && (
            <p className="text-xs text-gray-500 mt-1">{post.event_location}</p>
          )}
        </div>
        <Link
          href="/bulletin"
          className="shrink-0 text-xs text-brand hover:underline"
        >
          All events →
        </Link>
      </div>

      {posts.length > 1 && (
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setIdx((i) => (i - 1 + posts.length) % posts.length)}
            className="text-gray-400 hover:text-brand text-xs px-1"
          >
            ‹
          </button>
          <div className="flex gap-1">
            {posts.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-brand" : "bg-gray-300"}`}
              />
            ))}
          </div>
          <button
            onClick={() => setIdx((i) => (i + 1) % posts.length)}
            className="text-gray-400 hover:text-brand text-xs px-1"
          >
            ›
          </button>
          <span className="text-xs text-gray-400 ml-auto">{idx + 1} / {posts.length}</span>
        </div>
      )}
    </div>
  );
}
