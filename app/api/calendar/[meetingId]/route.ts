import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

function icsDate(iso: string) {
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "").replace("Z", "Z");
}

function escapeIcs(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params;
  const svc = createServiceClient();
  const { data: meeting } = await svc
    .from("meetings")
    .select("title, starts_at, ends_at, location, agenda, orgs(name)")
    .eq("id", meetingId)
    .single();

  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const org = meeting.orgs as unknown as { name: string } | null;
  const start = icsDate(meeting.starts_at);
  const end = meeting.ends_at
    ? icsDate(meeting.ends_at)
    : icsDate(new Date(new Date(meeting.starts_at).getTime() + 60 * 60 * 1000).toISOString());

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Unipodium//EN",
    "BEGIN:VEVENT",
    `UID:${meetingId}@unipodium.com`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(meeting.title)}`,
    org ? `ORGANIZER;CN=${escapeIcs(org.name)}:mailto:noreply@unipodium.com` : "",
    meeting.location ? `LOCATION:${escapeIcs(meeting.location)}` : "",
    meeting.agenda ? `DESCRIPTION:${escapeIcs(meeting.agenda)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="meeting.ics"`,
    },
  });
}
