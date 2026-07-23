import { createServiceClient } from "@/lib/supabase/service";

type NotifInput = {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
};

export async function notify(items: NotifInput[]) {
  if (items.length === 0) return;
  const admin = createServiceClient();
  await admin.from("notifications").insert(
    items.map((n) => ({
      user_id: n.userId,
      type: n.type,
      title: n.title,
      body: n.body ?? null,
      link: n.link ?? null,
    }))
  );
}
