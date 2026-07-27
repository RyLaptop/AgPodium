"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getMeetingsForOrgs, submitSpeakRequests } from "./actions";

type Org = { id: string; name: string; slug: string };
type Meeting = { id: string; title: string; starts_at: string; org_id: string; org_name: string };

type Step = "orgs" | "meetings" | "pitch";

export function MakeRequest({ allOrgs }: { allOrgs: Org[] }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("orgs");
  const [multiMode, setMultiMode] = useState(false);
  const [orgSearch, setOrgSearch] = useState("");
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingIds, setSelectedMeetingIds] = useState<Record<string, string>>({});
  const [pitch, setPitch] = useState("");
  const [minutes, setMinutes] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const reset = () => {
    setStep("orgs");
    setMultiMode(false);
    setOrgSearch("");
    setSelectedOrgIds([]);
    setMeetings([]);
    setSelectedMeetingIds({});
    setPitch("");
    setMinutes(2);
    setError(null);
  };

  const close = () => { setOpen(false); reset(); };

  const filteredOrgs = orgSearch
    ? allOrgs.filter((o) => o.name.toLowerCase().includes(orgSearch.toLowerCase()))
    : allOrgs;

  const toggleOrg = (orgId: string) => {
    if (multiMode) {
      setSelectedOrgIds((prev) =>
        prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId]
      );
    } else {
      setSelectedOrgIds([orgId]);
    }
  };

  const goToMeetings = () => {
    if (selectedOrgIds.length === 0) return;
    setError(null);
    startTransition(async () => {
      const m = await getMeetingsForOrgs(selectedOrgIds);
      if (m.length === 0) {
        setError("No upcoming meetings found for the selected org(s).");
        return;
      }
      setMeetings(m);
      setSelectedMeetingIds({});
      setStep("meetings");
    });
  };

  const goToPitch = () => {
    const missingOrgs = selectedOrgIds.filter((id) => !selectedMeetingIds[id]);
    if (missingOrgs.length > 0) {
      setError("Please select a meeting for each org.");
      return;
    }
    setError(null);
    setStep("pitch");
  };

  const submit = () => {
    if (pitch.trim().length < 5) { setError("Pitch must be at least 5 characters."); return; }
    setError(null);
    const targets = selectedOrgIds
      .filter((orgId) => selectedMeetingIds[orgId])
      .map((orgId) => ({ meetingId: selectedMeetingIds[orgId], requesterOrgId: null }));

    startTransition(async () => {
      const res = await submitSpeakRequests(targets, pitch.trim(), minutes);
      if (!res.ok) { setError(res.error); return; }
      close();
      router.refresh();
    });
  };

  const orgById = (id: string) => allOrgs.find((o) => o.id === id);
  const meetingsForOrg = (orgId: string) => meetings.filter((m) => m.org_id === orgId);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark transition"
      >
        + Make request
      </button>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          {step === "orgs" && "Step 1 of 3: Select org"}
          {step === "meetings" && "Step 2 of 3: Select meeting"}
          {step === "pitch" && "Step 3 of 3: Your pitch"}
        </h3>
        <button onClick={close} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
      </div>

      {/* Step 1: Org selection */}
      {step === "orgs" && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={multiMode}
              onChange={(e) => {
                setMultiMode(e.target.checked);
                setSelectedOrgIds([]);
              }}
              className="rounded"
            />
            Select multiple orgs
          </label>

          <input
            type="text"
            placeholder="Search orgs…"
            value={orgSearch}
            onChange={(e) => setOrgSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />

          <div className="max-h-56 overflow-y-auto space-y-1 border border-gray-100 rounded-lg p-1">
            {filteredOrgs.length === 0 && (
              <p className="text-sm text-gray-400 px-2 py-1">No orgs found.</p>
            )}
            {filteredOrgs.map((o) => {
              const selected = selectedOrgIds.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggleOrg(o.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                    selected
                      ? "bg-brand text-white"
                      : "hover:bg-gray-50 text-gray-800"
                  }`}
                >
                  {o.name}
                </button>
              );
            })}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={goToMeetings}
              disabled={selectedOrgIds.length === 0 || pending}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark disabled:opacity-50"
            >
              {pending ? "Loading…" : "Next →"}
            </button>
            <button onClick={close} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Meeting selection */}
      {step === "meetings" && (
        <div className="space-y-4">
          {selectedOrgIds.map((orgId) => {
            const org = orgById(orgId);
            const orgMeetings = meetingsForOrg(orgId);
            return (
              <div key={orgId}>
                <p className="text-sm font-medium text-gray-700 mb-1">{org?.name}</p>
                {orgMeetings.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No upcoming meetings.</p>
                ) : (
                  <div className="space-y-1">
                    {orgMeetings.map((m) => {
                      const selected = selectedMeetingIds[orgId] === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMeetingIds((prev) => ({ ...prev, [orgId]: m.id }))}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm border transition ${
                            selected
                              ? "border-brand bg-brand/5 text-brand"
                              : "border-gray-200 hover:border-brand text-gray-800"
                          }`}
                        >
                          <span className="font-medium">{m.title}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(m.starts_at).toLocaleDateString("en-US", {
                              weekday: "short", month: "short", day: "numeric",
                            })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button onClick={() => { setStep("orgs"); setError(null); }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              ← Back
            </button>
            <button onClick={goToPitch}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark">
              Next →
            </button>
            <button onClick={close} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Pitch */}
      {step === "pitch" && (
        <div className="space-y-3">
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 space-y-0.5">
            {selectedOrgIds.map((orgId) => {
              const org = orgById(orgId);
              const meetingId = selectedMeetingIds[orgId];
              const meeting = meetings.find((m) => m.id === meetingId);
              return (
                <p key={orgId}>
                  <span className="font-medium text-gray-700">{org?.name}</span>
                  {meeting && ` · ${meeting.title} (${new Date(meeting.starts_at).toLocaleDateString()})`}
                </p>
              );
            })}
          </div>

          <label className="block">
            <span className="text-sm font-medium">Your pitch</span>
            <textarea
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              rows={4}
              placeholder="What would you like to speak about?"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Minutes requested</span>
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              min={1}
              max={60}
              className="mt-1 w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button onClick={() => { setStep("meetings"); setError(null); }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              ← Back
            </button>
            <button
              onClick={submit}
              disabled={pending}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark disabled:opacity-60"
            >
              {pending ? "Submitting…" : `Submit${selectedOrgIds.length > 1 ? ` (${selectedOrgIds.length} requests)` : ""}`}
            </button>
            <button onClick={close} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
