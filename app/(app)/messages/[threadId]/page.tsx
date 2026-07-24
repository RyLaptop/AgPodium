import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { respondDm, sendDm } from "../actions";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();
  const { data: thread } = await svc.from("dm_threads")
    .select("id, status, initiated_by, user_a, user_b")
    .eq("id", threadId)
    .single();

  if (!thread || (thread.user_a !== user.id && thread.user_b !== user.id)) notFound();

  const otherId = thread.user_a === user.id ? thread.user_b : thread.user_a;
  const { data: other } = await svc.from("users").select("id, full_name, email").eq("id", otherId).single();
  const otherName = other?.full_name ?? other?.email?.split("@")[0] ?? "Unknown";

  const { data: messages } = await svc.from("dm_messages")
    .select("id, sender_id, body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  const isPending = thread.status === "pending";
  const isIncoming = isPending && thread.initiated_by !== user.id;
  const isAccepted = thread.status === "accepted";

  const acceptAction = async () => {
    "use server";
    await respondDm(threadId, true);
    redirect(`/messages/${threadId}`);
  };

  const declineAction = async () => {
    "use server";
    await respondDm(threadId, false);
    redirect("/messages");
  };

  const sendAction = async (formData: FormData) => {
    "use server";
    const body = String(formData.get("body") ?? "").trim();
    await sendDm(threadId, body);
    redirect(`/messages/${threadId}`);
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <Link href="/messages" className="text-sm text-gray-500 hover:text-brand">← Messages</Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl font-bold">
            <Link href={`/profile/${otherId}`} className="hover:text-brand">{otherName}</Link>
          </h1>
          <span className={`text-xs px-2 py-0.5 rounded ${
            isAccepted ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
          }`}>{thread.status}</span>
        </div>
      </div>

      {isIncoming && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-yellow-800">{otherName} wants to chat with you.</p>
          <div className="flex gap-2">
            <form action={acceptAction}>
              <button type="submit" className="px-4 py-2 bg-brand text-white text-sm rounded-lg hover:bg-brand-dark">
                Accept
              </button>
            </form>
            <form action={declineAction}>
              <button type="submit" className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                Decline
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 min-h-[200px]">
        {(!messages || messages.length === 0) ? (
          <p className="text-gray-400 text-sm text-center py-8">No messages yet.</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user.id;
            return (
              <div key={msg.id} className={`px-4 py-3 ${isMine ? "bg-brand/5" : ""}`}>
                <p className={`text-xs font-medium mb-1 ${isMine ? "text-brand" : "text-gray-500"}`}>
                  {isMine ? "You" : otherName}
                </p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.body}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            );
          })
        )}
      </div>

      {isAccepted && (
        <form action={sendAction} className="flex gap-2">
          <input
            name="body"
            required
            maxLength={2000}
            placeholder="Type a message…"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-sm"
          />
          <button type="submit"
            className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark text-sm shrink-0">
            Send
          </button>
        </form>
      )}

      {isPending && !isIncoming && (
        <p className="text-sm text-gray-500 italic text-center">
          Waiting for {otherName} to accept your message request.
        </p>
      )}
    </div>
  );
}
