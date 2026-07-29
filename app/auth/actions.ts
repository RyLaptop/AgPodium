"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowed } from "@/lib/auth/allowed-domains";
import type { University } from "@/lib/university";

export type SignInResult =
  | { ok: true; email: string; needsVerification?: boolean }
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
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { ok: false, error: "Please verify your email before signing in. Check your inbox for a confirmation link." };
    }
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
    options: {
      data: { full_name: name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/confirm`,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  // Set their university cookie now so it's ready after email verification
  const jar = await cookies();
  const cookieOpts = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" } as const;
  jar.set("uni", university, cookieOpts);

  // No session means Supabase sent a verification email — tell the UI to show the check-inbox screen
  if (!data.session) {
    return { ok: true, email, needsVerification: true };
  }

  // Email confirmation is disabled in the Supabase project — sign in happened immediately
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
