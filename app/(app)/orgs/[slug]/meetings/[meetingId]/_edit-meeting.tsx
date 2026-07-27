"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMeeting, updateMeetingSeries, deleteMeeting, deleteMeetingSeries } from "../actions";

function toLocal(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

type Props = {
  meetingId: string;
  orgSlug: string;
  seriesId?: string | null;
  title: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  agenda: string | null;
  slotsOpen: number;
  slotLength: number;
};

export function EditMeeting({ meetingId, orgSlug, seriesId, title, startsAt, endsAt, location, agenda, slotsOpen, slotLength }: Props) {
  const [open, setOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [applyToSeries, setApplyToSeries] = useState(false);
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
      if (applyToSeries && seriesId) {
        const res = await updateMeetingSeries(seriesId, orgSlug, {
          title: fields.title,
          location: fields.location,
          agenda: fields.agenda,
          slotsOpen: Number(fields.slotsOpen),
          slotLength: Number(fields.slotLength),
        });
        if (!res.ok) { setError(res.error); return; }
        // Also update this meeting's specific times
        await updateMeeting(meetingId, orgSlug, {
          title: fields.title,
          startsAt: fields.startsAt,
          endsAt: fields.endsAt,
          location: fields.location,
          agenda: fields.agenda,
          slotsOpen: Number(fields.slotsOpen),
          slotLength: Number(fields.slotLength),
        });
      } else {
        const res = await updateMeeting(meetingId, orgSlug, {
          title: fields.title,
          startsAt: fields.startsAt,
          endsAt: fields.endsAt,
          location: fields.location,
          agenda: fields.agenda,
          slotsOpen: Number(fields.slotsOpen),
          slotLength: Number(fields.slotLength),
        });
        if (!res.ok) { setError(res.error); return; }
      }
      setOpen(false);
      router.refresh();
    });
  };

  const doDelete = () => {
    if (applyToSeries && seriesId) {
      if (!confirm("Permanently delete all meetings in this series? This cannot be undone.")) return;
      startTransition(async () => { await deleteMeetingSeries(seriesId, orgSlug); });
    } else {
      if (!confirm("Permanently delete this meeting? This cannot be undone.")) return;
      startTransition(async () => { await deleteMeeting(meetingId, orgSlug); });
    }
  };

  const doDeleteJustThis = () => {
    if (!confirm("Permanently delete just this meeting? This cannot be undone.")) return;
    setDeleteConfirm(false);
    startTransition(async () => { await deleteMeeting(meetingId, orgSlug); });
  };

  const doDeleteSeries = () => {
    if (!confirm("Permanently delete ALL meetings in this series? This cannot be undone.")) return;
    setDeleteConfirm(false);
    startTransition(async () => { await deleteMeetingSeries(seriesId!, orgSlug); });
  };

  if (!open) {
    if (deleteConfirm && seriesId) {
      return (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-3 max-w-sm">
          <p className="text-sm font-medium text-red-800">This meeting is part of a recurring series.</p>
          <p className="text-xs text-red-700">Do you want to delete just this one, or all meetings in the series?</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={doDeleteJustThis}
              disabled={pending}
              className="text-sm px-3 py-1.5 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-60 text-left"
            >
              Delete just this meeting
            </button>
            <button
              onClick={doDeleteSeries}
              disabled={pending}
              className="text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 text-left"
            >
              Delete all meetings in this series
            </button>
            <button
              onClick={() => setDeleteConfirm(false)}
              disabled={pending}
              className="text-sm px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-left"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setOpen(true)}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Edit meeting
        </button>
        <button
          onClick={() => seriesId ? setDeleteConfirm(true) : doDelete()}
          disabled={pending}
          className="text-sm px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60"
        >
          Delete meeting
        </button>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="font-semibold">Edit meeting</h3>

      {seriesId && (
        <label className="flex items-center gap-2 text-sm text-brand cursor-pointer">
          <input
            type="checkbox"
            checked={applyToSeries}
            onChange={(e) => setApplyToSeries(e.target.checked)}
            className="rounded"
          />
          Apply changes to all meetings in this series
        </label>
      )}

      <label className="block">
        <span className="text-sm font-medium">Title</span>
        <input value={fields.title} onChange={set("title")}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
      </label>

      {!applyToSeries && (
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
      )}

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

      <div className="flex gap-2 flex-wrap">
        <button onClick={submit} disabled={pending}
          className="px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark disabled:opacity-60">
          {pending ? "Saving…" : "Save"}
        </button>
        <button onClick={() => { setOpen(false); setError(null); }} disabled={pending}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={doDelete} disabled={pending}
          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-60 ml-auto">
          {applyToSeries ? "Delete entire series" : "Delete meeting"}
        </button>
      </div>
    </div>
  );
}
