"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMeeting } from "../actions";

function toLocal(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

type Props = {
  meetingId: string;
  orgSlug: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  agenda: string | null;
  slotsOpen: number;
  slotLength: number;
};

export function EditMeeting({ meetingId, orgSlug, title, startsAt, endsAt, location, agenda, slotsOpen, slotLength }: Props) {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState({
    title,
    startsAt: toLocal(startsAt),
    endsAt: endsAt ? toLocal(endsAt) : "",
    location: location ?? "",
    agenda: agenda ?? "",
    slotsOpen,
    slotLength,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateMeeting(meetingId, orgSlug, {
        title: fields.title,
        startsAt: fields.startsAt,
        endsAt: fields.endsAt,
        location: fields.location,
        agenda: fields.agenda,
        slotsOpen: Number(fields.slotsOpen),
        slotLength: Number(fields.slotLength),
      });
      if (!res.ok) setError(res.error);
      else { setOpen(false); router.refresh(); }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Edit meeting
      </button>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="font-semibold">Edit meeting</h3>

      <label className="block">
        <span className="text-sm font-medium">Title</span>
        <input value={fields.title} onChange={set("title")}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Start</span>
          <input type="datetime-local" value={fields.startsAt} onChange={set("startsAt")}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">End (optional)</span>
          <input type="datetime-local" value={fields.endsAt} onChange={set("endsAt")}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Location</span>
        <input value={fields.location} onChange={set("location")} placeholder="MSC 2405"
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Agenda</span>
        <textarea value={fields.agenda} onChange={set("agenda")} rows={3}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Speaker slots</span>
          <input type="number" value={fields.slotsOpen} onChange={set("slotsOpen")} min={0} max={50}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Min per slot</span>
          <input type="number" value={fields.slotLength} onChange={set("slotLength")} min={1} max={60}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button onClick={submit} disabled={pending}
          className="px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark disabled:opacity-60">
          {pending ? "Saving…" : "Save"}
        </button>
        <button onClick={() => { setOpen(false); setError(null); }} disabled={pending}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  );
}
