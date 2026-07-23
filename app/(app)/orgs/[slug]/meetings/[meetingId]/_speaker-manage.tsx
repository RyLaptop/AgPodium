"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cancelApproved, moveSpeaker } from "@/app/(app)/requests/actions";

const ORDINALS = ["1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th","11th","12th"];

type Speaker = {
  id: string;
  requester_user_id: string;
  pitch: string;
  requested_minutes: number;
  status: string;
  speaker_order: number | null;
  users: unknown;
  orgs: unknown;
};

export function SpeakerManage({
  speakers,
  isOfficer,
  meetingId,
  orgSlug,
}: {
  speakers: Speaker[];
  isOfficer: boolean;
  meetingId: string;
  orgSlug: string;
}) {
  if (speakers.length === 0) {
    return <p className="text-gray-500 text-sm">No approved speakers yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {speakers.map((s, idx) => (
        <SpeakerRow
          key={s.id}
          speaker={s}
          idx={idx}
          total={speakers.length}
          isOfficer={isOfficer}
          meetingId={meetingId}
          orgSlug={orgSlug}
        />
      ))}
    </ul>
  );
}

function SpeakerRow({
  speaker,
  idx,
  total,
  isOfficer,
  meetingId,
  orgSlug,
}: {
  speaker: Speaker;
  idx: number;
  total: number;
  isOfficer: boolean;
  meetingId: string;
  orgSlug: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const user = speaker.users as { full_name: string | null; email: string };
  const org = speaker.orgs as { name: string } | null;
  const slot = speaker.speaker_order != null
    ? (ORDINALS[speaker.speaker_order - 1] ?? `#${speaker.speaker_order}`)
    : `#${idx + 1}`;

  const move = (dir: "up" | "down") => {
    startTransition(async () => {
      const res = await moveSpeaker(speaker.id, dir, meetingId, orgSlug);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  const remove = () => {
    if (!confirm("Remove this speaker? Their request will be cancelled and they'll be notified.")) return;
    startTransition(async () => {
      const res = await cancelApproved(speaker.id);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  return (
    <li className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-brand w-8 shrink-0">{slot}</span>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${speaker.requester_user_id}`} className="font-medium hover:text-brand hover:underline">
            {org ? org.name : (user.full_name ?? user.email.split("@")[0])}
          </Link>
          {org && (
            <Link href={`/profile/${speaker.requester_user_id}`} className="text-xs text-gray-500 hover:text-brand hover:underline block">
              {user.full_name ?? user.email.split("@")[0]}
            </Link>
          )}
          <p className="text-sm text-gray-600 mt-0.5">{speaker.pitch}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-gray-400 mr-1">{speaker.requested_minutes} min</span>
          {isOfficer && (
            <>
              <button
                onClick={() => move("up")}
                disabled={pending || idx === 0}
                title="Move up"
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 text-gray-500"
              >
                ▲
              </button>
              <button
                onClick={() => move("down")}
                disabled={pending || idx === total - 1}
                title="Move down"
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 text-gray-500"
              >
                ▼
              </button>
              <button
                onClick={remove}
                disabled={pending}
                title="Remove speaker"
                className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 ml-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
