"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminUpdateUser, adminDeleteUser } from "./actions";

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_site_admin: boolean;
  is_verified: boolean;
  created_at: string;
  last_sign_in_at: string | null;
};

function fmtLastSeen(ts: string | null): string {
  if (!ts) return "Never signed in";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 5) return "Active now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

const MAU_MS = 30 * 24 * 60 * 60 * 1000;

export function UserList({ users }: { users: UserRow[] }) {
  const [q, setQ] = useState("");
  const [mauOnly, setMauOnly] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const now = Date.now();
  const mauCount = users.filter(
    (u) => u.last_sign_in_at && now - new Date(u.last_sign_in_at).getTime() < MAU_MS
  ).length;

  const filtered = users
    .filter((u) => {
      if (mauOnly && !(u.last_sign_in_at && now - new Date(u.last_sign_in_at).getTime() < MAU_MS)) return false;
      if (q && !u.email.toLowerCase().includes(q.toLowerCase()) && !(u.full_name ?? "").toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const aIsMau = !!(a.last_sign_in_at && now - new Date(a.last_sign_in_at).getTime() < MAU_MS);
      const bIsMau = !!(b.last_sign_in_at && now - new Date(b.last_sign_in_at).getTime() < MAU_MS);
      if (aIsMau !== bIsMau) return aIsMau ? -1 : 1;
      const aTs = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
      const bTs = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
      return bTs - aTs;
    });

  const handleSave = () => {
    if (!editing || !formRef.current) return;
    const fd = new FormData(formRef.current);
    startTransition(async () => {
      setError(null);
      const res = await adminUpdateUser(editing.id, fd);
      if (!res.ok) { setError(res.error); return; }
      setEditing(null);
      router.refresh();
    });
  };

  const handleDelete = (u: UserRow) => {
    startTransition(async () => {
      setError(null);
      const res = await adminDeleteUser(u.id);
      if (!res.ok) { setError(res.error); setConfirmDelete(null); return; }
      setConfirmDelete(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {collapsed ? "▶ Show list" : "▼ Hide list"}
        </button>
        <button
          onClick={() => setMauOnly((m) => !m)}
          className={`px-3 py-1.5 text-sm rounded-lg border transition ${
            mauOnly
              ? "bg-green-600 text-white border-green-600"
              : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          MAU only ({mauCount})
        </button>
        {!collapsed && (
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        )}
      </div>

      {!collapsed && (
        <>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="text-xs text-gray-500">
            {filtered.length} user{filtered.length === 1 ? "" : "s"}
            {mauOnly && ` · ${mauCount} MAU total`}
          </div>
          <ul className="space-y-2">
            {filtered.map((u) => {
              const isMau = !!(u.last_sign_in_at && now - new Date(u.last_sign_in_at).getTime() < MAU_MS);
              return (
                <li key={u.id} className="border border-gray-200 rounded-lg p-3">
                  {editing?.id === u.id ? (
                    <form ref={formRef} onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <label className="block">
                          <span className="text-xs text-gray-500">Name</span>
                          <input name="full_name" defaultValue={u.full_name ?? ""} className="mt-0.5 w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                        </label>
                        <label className="block">
                          <span className="text-xs text-gray-500">Email</span>
                          <input name="email" type="email" defaultValue={u.email} className="mt-0.5 w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                        </label>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="is_site_admin" value="true" defaultChecked={u.is_site_admin} />
                        Site admin
                      </label>
                      <div className="flex gap-2">
                        <button type="submit" disabled={pending} className="px-3 py-1 text-sm bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60">Save</button>
                        <button type="button" onClick={() => { setEditing(null); setError(null); }} className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                      </div>
                    </form>
                  ) : confirmDelete?.id === u.id ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-red-700">Delete {u.full_name ?? u.email}? This is permanent.</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleDelete(u)} disabled={pending} className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60">Yes, delete</button>
                        <button onClick={() => setConfirmDelete(null)} className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {u.full_name ?? <span className="text-gray-400 italic">No name</span>}
                          {u.is_site_admin && <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-brand/10 text-brand rounded">admin</span>}
                          {!u.is_verified && !u.is_site_admin && <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">pending</span>}
                          {isMau && <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">MAU</span>}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        <p className="text-xs text-gray-400">
                          Joined {new Date(u.created_at).toLocaleDateString()} · {fmtLastSeen(u.last_sign_in_at)}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => { setEditing(u); setError(null); }} className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-brand">Edit</button>
                        <button onClick={() => setConfirmDelete(u)} className="px-2.5 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Delete</button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
