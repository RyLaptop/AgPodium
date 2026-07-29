"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { University } from "@/lib/university";

export async function changeUniversity(formData: FormData) {
  const newUni = String(formData.get("uni") ?? "") as University;
  if (newUni !== "tamu" && newUni !== "lsu") return;

  const jar = await cookies();

  // Enforce cooldown server-side — can't trust the client
  const lockedUntilStr = jar.get("uni_locked_until")?.value;
  if (lockedUntilStr && new Date(lockedUntilStr) > new Date()) return;

  const lockedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const cookieOpts = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" } as const;

  jar.set("uni", newUni, cookieOpts);
  jar.set("uni_locked_until", lockedUntil.toISOString(), cookieOpts);

  redirect("/dashboard");
}
