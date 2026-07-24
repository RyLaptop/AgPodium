"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type UpdateProfileResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(fields: {
  name: string;
  bio: string;
  major: string;
  avatarUrl?: string | null;
}): Promise<UpdateProfileResult> {
  const name = fields.name.trim();
  if (name.length < 1) return { ok: false, error: "Name is required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.from("users").update({
    full_name: name,
    bio: fields.bio.trim() || null,
    major: fields.major.trim() || null,
    avatar_url: fields.avatarUrl ?? null,
  }).eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/profile/${user.id}`);
  return { ok: true };
}

export async function deleteAccount(): Promise<{ ok: false; error: string } | never> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const svc = createServiceClient();
  const { error } = await svc.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, error: error.message };

  await supabase.auth.signOut();
  redirect("/");
}
