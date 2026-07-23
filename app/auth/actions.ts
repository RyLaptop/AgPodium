"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isEmailAllowed } from "@/lib/auth/allowed-domains";

export type SignInResult =
  | { ok: true; email: string }
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
    return { ok: false, error: "Only TAMU emails are allowed right now." };
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

  if (!email || !password) {
    return { ok: false, error: "Enter your email and password." };
  }
  if (!name) {
    return { ok: false, error: "Enter a display name." };
  }
  if (!isEmailAllowed(email)) {
    return { ok: false, error: "Only TAMU emails are allowed right now." };
  }

  const admin = createServiceClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  if (createError && !createError.message.includes("already registered")) {
    return { ok: false, error: createError.message };
  }

  // Sign in immediately with the session client so cookies are set.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { ok: false, error: signInError.message };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
