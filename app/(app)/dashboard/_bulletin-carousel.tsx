"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Post = {
  id: string;
  event_title: string;
  event_description: string | null;
  event_at: string;
  event_location: string | null;
  thumbnail_url: string | null;
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
  const prev = () => setIdx((i) => (i - 1 + posts.length) % posts.length);
  const next = () => setIdx((i) => (i + 1) % posts.length);

  return (
    <div className={`relative bg-gradient-to-r from-brand/5 to-brand/10 border border-brand/20 rounded-xl overflow-hidden ${posts.length > 1 ? "pb-14" : ""}`}>
      <Link href={`/bulletin/${post.id}`} className="flex items-stretch gap-0 group">
        {post.thumbnail_url && (
          <div className="shrink-0 w-28 md:w-36 self-stretch">
            <img
              src={post.thumbnail_url}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0 p-5 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-brand uppercase tracking-wide mb-1">
              {post.org_name ? `${post.org_name} · ` : ""}
              {new Date(post.event_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              {" · "}
              {new Date(post.event_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
            <p className="font-semibold text-gray-900 truncate group-hover:text-brand transition">{post.event_title}</p>
            {post.event_description && (
              <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{post.event_description}</p>
            )}
            {post.event_location && (
              <p className="text-xs text-gray-500 mt-1">{post.event_location}</p>
            )}
          </div>
          <span className="shrink-0 text-xs text-brand group-hover:underline">
            Details →
          </span>
        </div>
      </Link>

      {posts.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
          <button onClick={prev} aria-label="Previous"
            className="w-12 h-12 flex items-center justify-center text-4xl text-gray-400 hover:text-brand transition leading-none">
            ‹
          </button>
          <div className="flex gap-2 items-center">
            {posts.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all ${i === idx ? "w-3 h-3 bg-brand" : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400"}`}
              />
            ))}
          </div>
          <button onClick={next} aria-label="Next"
            className="w-12 h-12 flex items-center justify-center text-4xl text-gray-400 hover:text-brand transition leading-none">
            ›
          </button>
        </div>
      )}
    </div>
  );
}
