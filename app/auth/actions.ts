"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isEmailAllowed } from "@/lib/auth/allowed-domains";
import type { University } from "@/lib/university";

export type SignInResult =
  | { ok: true; email: string; pendingApproval?: boolean }
  | { ok: false; error: string };

export async function signInWithPassword(
  _prev: SignInResult | null,
  formData: FormData
): Promise<SignInResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, error: "Enter your email and password." };
  }
  if (!isEmailAllowed(email)) {
    return { ok: false, error: "That email domain isn't allowed on this platform." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, error: error.message };
  }
  redirect("/dashboard");
}

export async function signUpWithPassword(
  _prev: SignInResult | null,
  formData: FormData
): Promise<SignInResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const university = String(formData.get("university") ?? "") as University;

  if (!email || !password) {
    return { ok: false, error: "Enter your email and password." };
  }
  if (!name) {
    return { ok: false, error: "Enter a display name." };
  }
  if (university !== "tamu" && university !== "lsu") {
    return { ok: false, error: "Select your university." };
  }
  if (!isEmailAllowed(email)) {
    return { ok: false, error: "That email domain isn't allowed on this platform." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data.user) {
    return { ok: false, error: "Signup failed." };
  }

  // Auto-confirm the email so no verification email is sent —
  // account access is gated by admin approval (is_verified) instead.
  const svc = createServiceClient();
  await svc.auth.admin.updateUserById(data.user.id, { email_confirm: true });

  const jar = await cookies();
  jar.set("uni", university, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });

  return { ok: true, email, pendingApproval: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
