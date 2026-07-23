import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { getResend, FROM_EMAIL } from "@/lib/email/resend";
import { reminderEmail } from "@/lib/email/templates";

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

  if (due24h.length === 0 && due1h.length === 0) {
    return NextResponse.json({ sent24h: 0, sent1h: 0 });
  }

  const userIds = Array.from(
    new Set([...due24h, ...due1h].map((r) => r.requester_user_id))
  );
  const { data: users } = await supabase
    .from("users")
    .select("id, email, full_name")
    .in("id", userIds);
  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  const resend = getResend();
  let sent24h = 0;
  let sent1h = 0;

  for (const r of due24h) {
    const u = userMap.get(r.requester_user_id);
    if (!u || !r.meetings) continue;
    const { subject, html } = reminderEmail({
      recipientName: u.full_name ?? u.email.split("@")[0],
      orgName: r.meetings.orgs?.name ?? "the org",
      meetingTitle: r.meetings.title,
      startsAt: r.meetings.starts_at,
      location: r.meetings.location,
      hoursOut: 24,
    });
    await resend.emails.send({ from: FROM_EMAIL, to: u.email, subject, html });
    await supabase
      .from("speak_requests")
      .update({ reminder_24h_sent_at: new Date().toISOString() })
      .eq("id", r.id);
    sent24h++;
  }

  for (const r of due1h) {
    const u = userMap.get(r.requester_user_id);
    if (!u || !r.meetings) continue;
    const { subject, html } = reminderEmail({
      recipientName: u.full_name ?? u.email.split("@")[0],
      orgName: r.meetings.orgs?.name ?? "the org",
      meetingTitle: r.meetings.title,
      startsAt: r.meetings.starts_at,
      location: r.meetings.location,
      hoursOut: 1,
    });
    await resend.emails.send({ from: FROM_EMAIL, to: u.email, subject, html });
    await supabase
      .from("speak_requests")
      .update({ reminder_1h_sent_at: new Date().toISOString() })
      .eq("id", r.id);
    sent1h++;
  }

  return NextResponse.json({ sent24h, sent1h });
}
