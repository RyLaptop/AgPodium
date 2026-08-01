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
  const { error } = await svc.from("ad_clicks").insert({ variant, tier });
  if (error) {
    console.error("[ad-click]", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
