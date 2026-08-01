import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  reminder_24h_sent_at: string | null;
  reminder_1h_sent_at: string | null;
  requester_user_id: string;
  meetings: {
    title: string;
    starts_at: string;
    location: string | null;
    orgs: { name: string } | null;
  } | null;
};

// Sends 24h and 1h reminders to speakers with approved requests. Call every
// 15-30 min via an external pinger — windows below are sized to comfortably
// straddle that interval so nobody gets skipped or double-emailed
// (reminder_24h_sent_at / reminder_1h_sent_at dedup columns handle the rest).
export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = Date.now();
  const HOUR = 3600_000;

  const { data: approved, error } = await supabase
    .from("speak_requests")
    .select(
      "id, reminder_24h_sent_at, reminder_1h_sent_at, requester_user_id, meetings(title, starts_at, location, orgs(name))"
    )
    .eq("status", "approved");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (approved ?? []) as unknown as Row[];

  const in24h = { lo: now + 23 * HOUR, hi: now + 25 * HOUR };
  const in1h = { lo: now + 0.5 * HOUR, hi: now + 1.5 * HOUR };

  const due24h = rows.filter((r) => {
    if (!r.meetings || r.reminder_24h_sent_at) return false;
    const t = new Date(r.meetings.starts_at).getTime();
    return t >= in24h.lo && t <= in24h.hi;
  });
  const due1h = rows.filter((r) => {
    if (!r.meetings || r.reminder_1h_sent_at) return false;
    const t = new Date(r.meetings.starts_at).getTime();
    return t >= in1h.lo && t <= in1h.hi;
  });

  // Mark reminders as "sent" to prevent re-processing, but do not send emails
  // (email notifications are restricted to org creation, bulletin, and DM events only)
  let sent24h = 0;
  let sent1h = 0;

  for (const r of due24h) {
    await supabase
      .from("speak_requests")
      .update({ reminder_24h_sent_at: new Date().toISOString() })
      .eq("id", r.id);
    sent24h++;
  }

  for (const r of due1h) {
    await supabase
      .from("speak_requests")
      .update({ reminder_1h_sent_at: new Date().toISOString() })
      .eq("id", r.id);
    sent1h++;
  }

  return NextResponse.json({ sent24h, sent1h });
}
