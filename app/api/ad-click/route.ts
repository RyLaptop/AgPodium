import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

const TIER_MAP: Record<string, string> = {
  footer: "universal",
  apartment: "premium",
  ffac: "standard",
  calendar: "standard",
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const variant = String(body.variant ?? "");
  const tier = TIER_MAP[variant] ?? "standard";
  const svc = createServiceClient();
  await svc.from("ad_clicks").insert({ variant, tier });
  return NextResponse.json({ ok: true });
}
