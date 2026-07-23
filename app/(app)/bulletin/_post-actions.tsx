"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelBulletinPost, editBulletinPost } from "./actions";

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Props = {
  postId: string;
  title: string;
  description: string | null;
  eventAt: string;
  location: string | null;
};

export function PostActions({ postId, title, description, eventAt, location }: Props) {
  const [editing, setEditing] = useState(false);
  const [pendingCancel, startCancel] = useTransition();
  const [pendingSave, startSave] = useTransition();
  const [editTitle, setEditTitle] = useState(title);
  const [editDesc, setEditDesc] = useState(description ?? "");
  const [editAt, setEditAt] = useState(toDatetimeLocal(eventAt));
  const [editLoc, setEditLoc] = useState(location ?? "");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCancel = () => {
    if (!confirm("Remove this event from the bulletin board?")) return;
    startCancel(async () => {
      const res = await cancelBulletinPost(postId);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  const handleSave = () => {
    setError(null);
    startSave(async () => {
      const res = await editBulletinPost(postId, {
        title: editTitle,
        description: editDesc,
        eventAt: editAt,
        location: editLoc,
      });
      if (!res.ok) setError(res.error);
      else { setEditing(false); router.refresh(); }
    });
  };

  return (
    <>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => setEditing((v) => !v)}
          title="Edit event"
          className="p-1 text-gray-400 hover:text-brand transition rounded"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
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

      {editing && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Title</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mt-0.5 w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Description</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={2}
              className="mt-0.5 w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Date &amp; time</label>
              <input
                type="datetime-local"
                value={editAt}
                onChange={(e) => setEditAt(e.target.value)}
                className="mt-0.5 w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Location</label>
              <input
                value={editLoc}
                onChange={(e) => setEditLoc(e.target.value)}
                className="mt-0.5 w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={pendingSave}
              className="px-3 py-1.5 bg-brand text-white rounded-lg text-xs hover:bg-brand-dark disabled:opacity-60"
            >
              {pendingSave ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setEditing(false); setError(null); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
