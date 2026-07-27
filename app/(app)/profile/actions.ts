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

export async function uploadAvatar(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "No file provided." };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "Photo must be under 5MB." };
  if (!file.type.startsWith("image/")) return { ok: false, error: "File must be an image." };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;
  const bytes = await file.arrayBuffer();

  const svc = createServiceClient();
  const { error: upErr } = await svc.storage.from("avatars").upload(path, bytes, {
    contentType: file.type,
    upsert: true,
  });
  if (upErr) return { ok: false, error: upErr.message };

  const { data: { publicUrl } } = svc.storage.from("avatars").getPublicUrl(path);
  return { ok: true, url: `${publicUrl}?t=${Date.now()}` };
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
