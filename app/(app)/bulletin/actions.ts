"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { notify } from "@/lib/notifications";
import { getUniversity } from "@/lib/university";

export type SubmitBulletinResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function submitBulletinPost(
  _prev: SubmitBulletinResult | null,
  formData: FormData
): Promise<SubmitBulletinResult> {
  const eventTitle = String(formData.get("event_title") ?? "").trim();
  const eventDescription = String(formData.get("event_description") ?? "").trim();
  const eventAtStr = String(formData.get("event_at") ?? "").trim();
  const eventLocation = String(formData.get("event_location") ?? "").trim();
  const orgId = String(formData.get("org_id") ?? "").trim();
  const websiteUrl = String(formData.get("website_url") ?? "").trim() || null;
  const instagramUrl = String(formData.get("instagram_url") ?? "").trim() || null;
  const thumbnailFile = formData.get("thumbnail") as File | null;
  const bannerFile = formData.get("banner") as File | null;

  if (eventTitle.length < 3) {
    return { ok: false, error: "Title is too short (min 3 chars)." };
  }
  if (!eventAtStr) {
    return { ok: false, error: "Event date/time is required." };
  }
  const eventAt = new Date(eventAtStr);
  if (isNaN(eventAt.getTime())) {
    return { ok: false, error: "Invalid date/time." };
  }
  if (eventAt.getTime() < Date.now() - 60 * 60 * 1000) {
    return { ok: false, error: "Event date is in the past." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const uni = await getUniversity();

  if (orgId) {
    const { data: mem } = await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", orgId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (!mem || !["officer", "director"].includes(mem.role)) {
      return { ok: false, error: "You must be an officer or director to submit on behalf of an org." };
    }
  }

  const svc = createServiceClient();

  const { data, error } = await supabase
    .from("bulletin_posts")
    .insert({
      submitter_id: user.id,
      org_id: orgId || null,
      event_title: eventTitle,
      event_description: eventDescription || null,
      event_at: eventAt.toISOString(),
      event_location: eventLocation || null,
      website_url: websiteUrl,
      instagram_url: instagramUrl,
      status: "pending",
      university: uni,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Insert failed." };

  // Upload images to storage and update post with URLs
  const postId = data.id;
  const imageUpdates: { thumbnail_url?: string; banner_url?: string } = {};

  async function uploadImage(file: File, slot: "thumbnail" | "banner") {
    if (!file || file.size === 0) return;
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${postId}/${slot}.${ext}`;
    const bytes = await file.arrayBuffer();
    const { error: uploadErr } = await svc.storage
      .from("bulletin-images")
      .upload(path, bytes, { contentType: file.type, upsert: true });
    if (!uploadErr) {
      const { data: { publicUrl } } = svc.storage.from("bulletin-images").getPublicUrl(path);
      imageUpdates[`${slot}_url` as "thumbnail_url" | "banner_url"] = publicUrl;
    }
  }

  await Promise.all([
    thumbnailFile && thumbnailFile.size > 0 ? uploadImage(thumbnailFile, "thumbnail") : Promise.resolve(),
    bannerFile && bannerFile.size > 0 ? uploadImage(bannerFile, "banner") : Promise.resolve(),
  ]);

  if (Object.keys(imageUpdates).length > 0) {
    await svc.from("bulletin_posts").update(imageUpdates).eq("id", postId);
  }

  revalidatePath("/bulletin");
  redirect("/bulletin?submitted=1");
}

export async function cancelBulletinPost(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: profile } = await supabase.from("users").select("is_site_admin").eq("id", user.id).single();
  const isAdmin = profile?.is_site_admin ?? false;

  const svc = createServiceClient();
  const { data: post } = await svc.from("bulletin_posts").select("submitter_id, org_id").eq("id", id).single();
  if (!post) return { ok: false as const, error: "Post not found." };

  if (!isAdmin) {
    const isSubmitter = post.submitter_id === user.id;
    let isOrgStaff = false;
    if (post.org_id) {
      const { data: mem } = await supabase.from("org_members").select("role")
        .eq("org_id", post.org_id).eq("user_id", user.id).eq("status", "active").maybeSingle();
      isOrgStaff = mem?.role === "director";
    }
    if (!isSubmitter && !isOrgStaff) return { ok: false as const, error: "Not authorized." };
  }

  const { error } = await svc.from("bulletin_posts").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/bulletin");
  return { ok: true as const };
}

export type EditBulletinResult = { ok: true } | { ok: false; error: string };

export async function editBulletinPost(
  id: string,
  fields: { title: string; description: string; eventAt: string; location: string }
): Promise<EditBulletinResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  if (fields.title.length < 3) return { ok: false, error: "Title too short." };
  const eventDate = new Date(fields.eventAt);
  if (isNaN(eventDate.getTime())) return { ok: false, error: "Invalid date." };

  const { data: profile } = await supabase.from("users").select("is_site_admin").eq("id", user.id).single();
  const isAdmin = profile?.is_site_admin ?? false;

  const svc = createServiceClient();
  const { data: post } = await svc.from("bulletin_posts").select("submitter_id, org_id").eq("id", id).single();
  if (!post) return { ok: false, error: "Post not found." };

  if (!isAdmin) {
    const isSubmitter = post.submitter_id === user.id;
    let isOrgStaff = false;
    if (post.org_id) {
      const { data: mem } = await supabase.from("org_members").select("role")
        .eq("org_id", post.org_id).eq("user_id", user.id).eq("status", "active").maybeSingle();
      isOrgStaff = mem?.role === "director";
    }
    if (!isSubmitter && !isOrgStaff) return { ok: false, error: "Not authorized." };
  }

  const { error } = await svc.from("bulletin_posts").update({
    event_title: fields.title,
    event_description: fields.description || null,
    event_at: eventDate.toISOString(),
    event_location: fields.location || null,
  }).eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/bulletin");
  return { ok: true };
}

export async function clearBulletinPost(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const svc = createServiceClient();
  const { error, count } = await svc
    .from("bulletin_posts")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("submitter_id", user.id)
    .eq("status", "denied");

  if (error) return { ok: false as const, error: error.message };
  if (count === 0) return { ok: false as const, error: "Post not found or already cleared." };

  revalidatePath("/bulletin");
  return { ok: true as const };
}

export async function reviewBulletinPost(
  id: string,
  decision: "approved" | "denied"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const svc = createServiceClient();
  const { error } = await svc
    .from("bulletin_posts")
    .update({
      status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false as const, error: error.message };

  const { data: post } = await svc
    .from("bulletin_posts")
    .select("submitter_id, event_title")
    .eq("id", id)
    .single();
  if (post) {
    await notify([{
      userId: post.submitter_id,
      type: "bulletin_update",
      title: decision === "approved" ? "Bulletin post approved!" : "Bulletin post declined",
      body: post.event_title,
      link: "/bulletin",
    }]);
  }

  revalidatePath("/bulletin");
  revalidatePath("/bulletin/admin");
  return { ok: true as const };
}
