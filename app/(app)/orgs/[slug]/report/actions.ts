"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitReport(orgId: string, content: string) {
  if (!content.trim()) return { ok: false as const, error: "Report content is required." };
  if (content.trim().length < 10) return { ok: false as const, error: "Please provide more detail (at least 10 characters)." };

  const supabase = await createClient();
  const { error } = await supabase.from("incident_reports").insert({ org_id: orgId, content: content.trim() });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
