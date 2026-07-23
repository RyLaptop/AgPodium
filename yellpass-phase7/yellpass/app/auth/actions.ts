"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowed } from "@/lib/auth/allowed-domains";

export type SignInResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

export async function signInWithEmail(
  _prev: SignInResult | null,
  formData: FormData
): Promise<SignInResult> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return { ok: false, error: "Enter a valid email." };
  }
  if (!isEmailAllowed(email)) {
    return {
      ok: false,
      error: "Only TAMU emails are allowed right now.",
    };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
      // If a matching auth.users doesn't exist, one is created — magic link doubles as signup.
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, email };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
