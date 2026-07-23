import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

// Flips approved speak_requests to no_show if the meeting ended more than
// 30 min ago and nobody marked it completed. Call every 15-30 min via an
// external pinger (Vercel Hobby cron can't run this often).
export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data: candidates, error } = await supabase
    .from("speak_requests")
    .select("id, meetings(ends_at, starts_at)")
    .eq("status", "approved");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const toFlip = (candidates ?? [])
    .filter((r) => {
      const m = r.meetings as unknown as {
        ends_at: string | null;
        starts_at: string;
      } | null;
      if (!m) return false;
      const endTime = m.ends_at ?? m.starts_at;
      return endTime < cutoff;
    })
    .map((r) => r.id);

  if (toFlip.length > 0) {
    const { error: updateError } = await supabase
      .from("speak_requests")
      .update({ status: "no_show" })
      .in("id", toFlip);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ flipped: toFlip.length });
}
