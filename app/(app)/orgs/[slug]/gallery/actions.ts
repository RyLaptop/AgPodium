"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isOrgStaff } from "@/lib/auth/org-access";

export async function createOrgPost(orgId: string, orgSlug: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  if (!await isOrgStaff(supabase, orgId, user.id)) return { ok: false as const, error: "Only staff can post." };

  const caption = String(formData.get("caption") ?? "").trim();
  const file = formData.get("image") as File | null;

  if (!caption && (!file || file.size === 0)) return { ok: false as const, error: "Add a caption or image." };

  const svc = createServiceClient();
  let imageUrl: string | null = null;

  if (file && file.size > 0) {
    if (!file.type.startsWith("image/")) return { ok: false as const, error: "File must be an image." };
    if (file.size > 5 * 1024 * 1024) return { ok: false as const, error: "Image must be under 5MB." };
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${orgId}/${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const { error: upErr } = await svc.storage.from("org-posts").upload(path, bytes, { contentType: file.type });
    if (upErr) return { ok: false as const, error: upErr.message };
    const { data: { publicUrl } } = svc.storage.from("org-posts").getPublicUrl(path);
    imageUrl = publicUrl;
  }

  const { error } = await svc.from("org_posts").insert({
    org_id: orgId,
    author_id: user.id,
    caption: caption || null,
    image_url: imageUrl,
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/orgs/${orgSlug}/gallery`);
  return { ok: true as const };
}

export async function deleteOrgPost(postId: string, orgId: string, orgSlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in." };

  const svc = createServiceClient();
  const { data: post } = await svc.from("org_posts").select("author_id, image_url").eq("id", postId).single();
  if (!post) return { ok: false as const, error: "Post not found." };

  const isAuthor = post.author_id === user.id;
  const isStaff = await isOrgStaff(supabase, orgId, user.id);
  if (!isAuthor && !isStaff) return { ok: false as const, error: "Not authorized." };

  if (post.image_url) {
    const url = new URL(post.image_url);
    const parts = url.pathname.split("/org-posts/");
    if (parts[1]) await svc.storage.from("org-posts").remove([parts[1]]);
  }

  const { error } = await svc.from("org_posts").delete().eq("id", postId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/orgs/${orgSlug}/gallery`);
  return { ok: true as const };
}
