"use client";

import { useState } from "react";
import { Chat, type ChatMessage, type ChatUser } from "@/app/(app)/requests/[id]/_chat";

type SpeakerTab = {
  requestId: string;
  label: string;
  sublabel?: string;
};

export function StaffChat({
  speakers,
  initialMessagesByRequest,
  users,
  currentUserId,
}: {
  speakers: SpeakerTab[];
  initialMessagesByRequest: Record<string, ChatMessage[]>;
  users: ChatUser[];
  currentUserId: string;
}) {
  const [activeId, setActiveId] = useState(speakers[0]?.requestId ?? "");

  if (speakers.length === 0) return null;

  const hasTabs = speakers.length > 1;

  return (
    <div>
      {hasTabs && (
        <div className="flex border border-gray-200 border-b-0 rounded-t-lg bg-gray-50 overflow-x-auto">
          {speakers.map((s) => (
            <button
              key={s.requestId}
              onClick={() => setActiveId(s.requestId)}
              className={`px-4 py-2.5 text-sm shrink-0 border-b-2 transition-colors ${
                activeId === s.requestId
                  ? "border-brand text-brand font-medium bg-white"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>{s.label}</span>
              {s.sublabel && (
                <span className="text-xs text-gray-400 ml-1.5">{s.sublabel}</span>
              )}
            </button>
          ))}
        </div>
      )}
      <Chat
        key={activeId}
        requestId={activeId}
        currentUserId={currentUserId}
        initialMessages={initialMessagesByRequest[activeId] ?? []}
        users={users}
        hideHeader={hasTabs}
        className={hasTabs ? "rounded-t-none border-t-0" : ""}
      />
    </div>
  );
}
