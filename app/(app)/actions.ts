"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { notify } from "@/lib/notifications";

export async function submitSiteFeedback(message: string): Promise<{ ok: boolean; error?: string }> {
  const trimmed = message.trim();
  if (!trimmed) return { ok: false, error: "Message is empty." };
  if (trimmed.length > 1000) return { ok: false, error: "Message too long (max 1000 chars)." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const svc = createServiceClient();
  const { data: admins } = await svc.from("users").select("id").eq("is_site_admin", true);
  if (!admins || admins.length === 0) return { ok: true };

  const from = user?.email ?? "Anonymous";
  await notify(admins.map((a) => ({
    userId: a.id,
    type: "site_feedback",
    title: `Feedback from ${from}`,
    body: trimmed,
  })));

  return { ok: true };
}
