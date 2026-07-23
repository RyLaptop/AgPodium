"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ChatMessage = {
  id: string;
  speak_request_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type ChatUser = {
  id: string;
  full_name: string | null;
  email: string;
};

export function Chat({
  requestId,
  currentUserId,
  initialMessages,
  users,
}: {
  requestId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  users: ChatUser[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userMap = useMemo(() => {
    const m = new Map<string, ChatUser>();
    users.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  // Subscribe to inserts on chat_messages for this request
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `speak_request_id=eq.${requestId}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => {
            // Skip if we already have it (optimistic sends)
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, requestId]);

  // Auto-scroll on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = useCallback(async () => {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setError(null);

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      speak_request_id: requestId,
      user_id: currentUserId,
      body,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");

    const { data, error: insertError } = await supabase
      .from("chat_messages")
      .insert({
        speak_request_id: requestId,
        user_id: currentUserId,
        body,
      })
      .select()
      .single();

    setSending(false);

    if (insertError) {
      // Roll back optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(body);
      setError(insertError.message);
      return;
    }

    // Replace optimistic with real (dedup covered by subscription check too)
    setMessages((prev) =>
      prev.map((m) => (m.id === tempId ? (data as ChatMessage) : m))
    );
  }, [draft, requestId, currentUserId, supabase]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-[500px]">
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold">Chat</h3>
        <p className="text-xs text-gray-500">
          Between the speaker and this meeting&apos;s officers.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No messages yet. Say hi.
          </p>
        ) : (
          messages.map((m) => {
            const isMine = m.user_id === currentUserId;
            const sender = userMap.get(m.user_id);
            const senderName = sender
              ? sender.full_name ?? sender.email.split("@")[0]
              : "…";
            return (
              <div
                key={m.id}
                className={`flex flex-col ${
                  isMine ? "items-end" : "items-start"
                }`}
              >
                <span className="text-xs text-gray-500 mb-0.5">
                  {senderName} · {formatTime(m.created_at)}
                </span>
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                    isMine
                      ? "bg-brand text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-900 rounded-bl-sm"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-gray-200 p-3 space-y-2">
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            onClick={send}
            disabled={sending || !draft.trim()}
            className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60 text-sm shrink-0"
          >
            Send
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleString();
}
