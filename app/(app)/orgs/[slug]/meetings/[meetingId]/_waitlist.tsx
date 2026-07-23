"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinWaitlist, leaveWaitlist } from "../actions";

export function WaitlistButton({
  meetingId,
  orgSlug,
  onWaitlist,
  waitlistCount,
  maxMinutes,
  myOrgs,
}: {
  meetingId: string;
  orgSlug: string;
  onWaitlist: boolean;
  waitlistCount: number;
  maxMinutes: number;
  myOrgs: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [pitch, setPitch] = useState("");
  const [minutes, setMinutes] = useState(String(maxMinutes));
  const [orgId, setOrgId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleJoin = () => {
    if (pitch.trim().length < 5) {
      setError("Pitch must be at least 5 characters.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await joinWaitlist(meetingId, orgSlug, {
        pitch: pitch.trim(),
        requestedMinutes: Number(minutes),
        requesterOrgId: orgId || null,
      });
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  };

  const handleLeave = () => {
    if (!confirm("Leave the waitlist? Your pitch will be removed.")) return;
    startTransition(async () => {
      const res = await leaveWaitlist(meetingId, orgSlug);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  if (onWaitlist) {
    return (
      <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium text-yellow-800">
          You&apos;re on the waitlist
          {waitlistCount > 1 && ` · ${waitlistCount} people waiting`}.
        </p>
        <p className="text-xs text-yellow-700">
          If a slot opens up you&apos;ll be automatically placed and notified — no action needed.
        </p>
        <button
          onClick={handleLeave}
          disabled={pending}
          className="text-xs px-3 py-1.5 border border-yellow-300 rounded-lg text-yellow-700 hover:bg-yellow-100 disabled:opacity-60"
        >
          {pending ? "…" : "Leave waitlist"}
        </button>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <p className="text-sm text-gray-600">
        This meeting is full. Fill out a pitch below and you&apos;ll be automatically placed if a slot opens.
        {waitlistCount > 0 && (
          <span className="ml-1 font-medium">
            {waitlistCount} {waitlistCount === 1 ? "person" : "people"} ahead of you.
          </span>
        )}
      </p>

      {myOrgs.length > 0 && (
        <label className="block">
          <span className="text-sm font-medium">Requesting on behalf of</span>
          <select
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">Myself</option>
            {myOrgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="text-sm font-medium">What will you speak about?</span>
        <textarea
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          rows={3}
          placeholder="Give a brief pitch…"
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Minutes requested (max {maxMinutes})</span>
        <input
          type="number"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          min={1}
          max={maxMinutes}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleJoin}
        disabled={pending}
        className="w-full px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Joining waitlist…" : "Join waitlist"}
      </button>
    </div>
  );
}
