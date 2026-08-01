"use client";

import { useState, useTransition } from "react";
import { createAward, deleteAward, assignAward, revokeAward } from "./actions";

type Award = { id: string; name: string; description: string | null; created_at: string };
type MemberAward = { id: string; award_id: string; user_id: string; note: string | null; awarded_at: string; recipient_name: string };
type Member = { user_id: string; full_name: string | null; email: string };

export function AwardsManager({ orgId, orgSlug, isStaff, awards, memberAwards, members }: {
  orgId: string; orgSlug: string; isStaff: boolean;
  awards: Award[]; memberAwards: MemberAward[]; members: Member[];
}) {
  return (
    <div className="space-y-6">
      {isStaff && <CreateAwardForm orgId={orgId} orgSlug={orgSlug} />}

      {awards.length === 0 ? (
        <p className="text-sm text-gray-500">{isStaff ? "No awards yet. Create one above." : "No awards created yet."}</p>
      ) : (
        awards.map((award) => {
          const earned = memberAwards.filter((ma) => ma.award_id === award.id);
          return (
            <div key={award.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{award.name}</h3>
                  {award.description && <p className="text-sm text-gray-500 mt-0.5">{award.description}</p>}
                </div>
                {isStaff && <DeleteAwardButton awardId={award.id} orgId={orgId} orgSlug={orgSlug} />}
              </div>

              {earned.length > 0 && (
                <ul className="space-y-1.5">
                  {earned.map((ma) => (
                    <li key={ma.id} className="flex items-center justify-between text-sm bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                      <div>
                        <span className="font-medium">{ma.recipient_name}</span>
                        {ma.note && <span className="text-gray-500"> — {ma.note}</span>}
                        <span className="text-xs text-gray-400 ml-2">{new Date(ma.awarded_at).toLocaleDateString()}</span>
                      </div>
                      {isStaff && <RevokeButton memberAwardId={ma.id} orgId={orgId} orgSlug={orgSlug} />}
                    </li>
                  ))}
                </ul>
              )}

              {isStaff && (
                <AssignForm awardId={award.id} orgId={orgId} orgSlug={orgSlug} members={members} />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function CreateAwardForm({ orgId, orgSlug }: { orgId: string; orgSlug: string }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      setError(null);
      const res = await createAward(orgId, orgSlug, name, description);
      if (!res.ok) { setError(res.error); return; }
      setName(""); setDescription("");
    });
  };

  return (
    <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3">
      <p className="text-sm font-medium">Create award type</p>
      <input
        value={name} onChange={(e) => setName(e.target.value)} placeholder="Award name"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <input
        value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={submit} disabled={pending || !name.trim()}
        className="px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark disabled:opacity-60">
        {pending ? "Creating…" : "Create award"}
      </button>
    </div>
  );
}

function DeleteAwardButton({ awardId, orgId, orgSlug }: { awardId: string; orgId: string; orgSlug: string }) {
  const [pending, startTransition] = useTransition();
  const del = () => {
    if (!confirm("Delete this award type? All assignments will also be removed.")) return;
    startTransition(async () => { await deleteAward(awardId, orgId, orgSlug); });
  };
  return (
    <button onClick={del} disabled={pending}
      className="text-xs text-red-500 hover:underline disabled:opacity-50 shrink-0">
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

function AssignForm({ awardId, orgId, orgSlug, members }: {
  awardId: string; orgId: string; orgSlug: string; members: Member[];
}) {
  const [userId, setUserId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!userId) return;
    startTransition(async () => {
      setError(null);
      const res = await assignAward(awardId, userId, orgId, orgSlug, note);
      if (!res.ok) { setError(res.error); return; }
      setUserId(""); setNote("");
    });
  };

  return (
    <div className="border-t border-gray-100 pt-3 space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        <select value={userId} onChange={(e) => setUserId(e.target.value)}
          className="flex-1 min-w-36 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand">
          <option value="">Assign to member…</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.full_name ?? m.email.split("@")[0]}
            </option>
          ))}
        </select>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)"
          className="flex-1 min-w-36 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <button onClick={submit} disabled={pending || !userId}
          className="px-3 py-1.5 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark disabled:opacity-60">
          {pending ? "Assigning…" : "Assign"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function RevokeButton({ memberAwardId, orgId, orgSlug }: { memberAwardId: string; orgId: string; orgSlug: string }) {
  const [pending, startTransition] = useTransition();
  const revoke = () => {
    startTransition(async () => { await revokeAward(memberAwardId, orgId, orgSlug); });
  };
  return (
    <button onClick={revoke} disabled={pending}
      className="text-xs text-red-500 hover:underline disabled:opacity-50 ml-2 shrink-0">
      {pending ? "…" : "Revoke"}
    </button>
  );
}
