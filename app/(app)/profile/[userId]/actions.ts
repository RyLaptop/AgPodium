"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UNIVERSITIES } from "@/lib/university-data";
import type { University } from "@/lib/university";

const MAX_SWITCHES = 2;
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const VALID_UNI_KEYS = Object.keys(UNIVERSITIES) as University[];

export async function changeUniversity(formData: FormData) {
  const newUni = String(formData.get("uni") ?? "") as University;
  if (!VALID_UNI_KEYS.includes(newUni)) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase.from("users").select("is_site_admin").eq("id", user.id).single();
  const isAdmin = profile?.is_site_admin ?? false;

  const jar = await cookies();
  const cookieOpts = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" } as const;

  if (!isAdmin) {
    const windowStartStr = jar.get("uni_switch_window_start")?.value;
    const countStr = jar.get("uni_switch_count")?.value;
    const windowStart = windowStartStr ? new Date(windowStartStr) : null;
    const windowAge = windowStart ? Date.now() - windowStart.getTime() : Infinity;
    const inWindow = windowAge < WINDOW_MS;
    const count = inWindow ? parseInt(countStr ?? "0", 10) : 0;

    if (count >= MAX_SWITCHES) return; // still locked, action is a no-op

    const newCount = count + 1;
    const newWindowStart = inWindow && windowStart ? windowStart : new Date();
    jar.set("uni_switch_count", String(newCount), cookieOpts);
    jar.set("uni_switch_window_start", newWindowStart.toISOString(), cookieOpts);
  }

  jar.set("uni", newUni, cookieOpts);
  redirect("/dashboard");
}
