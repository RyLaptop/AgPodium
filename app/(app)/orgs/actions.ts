"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { notify } from "@/lib/notifications";

export type CreateOrgResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export async function createOrg(
  _prev: CreateOrgResult | null,
  formData: FormData
): Promise<CreateOrgResult> {
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const tags = formData.getAll("tags").map(String).filter(Boolean);

  if (!/^[a-z0-9-]{2,40}$/.test(slug)) {
    return {
      ok: false,
      error: "Slug must be 2–40 chars, lowercase letters, numbers, and dashes.",
    };
  }
  if (name.length < 2) {
    return { ok: false, error: "Name is too short." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_org", {
    p_slug: slug,
    p_name: name,
    p_description: description,
  });

  if (error) {
    if (error.message.includes("duplicate") || error.code === "23505") {
      return { ok: false, error: "That slug is already taken." };
    }
    return { ok: false, error: error.message };
  }

  const svc = createServiceClient();
  // Set status to pending and apply tags
  await svc.from("orgs").update({ status: "pending", ...(tags.length > 0 ? { tags } : {}) }).eq("slug", slug);

  // Notify all site admins
  const { data: admins } = await svc.from("users").select("id").eq("is_site_admin", true);
  if (admins && admins.length > 0) {
    await notify(admins.map((a) => ({
      userId: a.id,
      type: "org_member_request" as const,
      title: `New org request: ${name}`,
      body: `"${slug}" is pending approval`,
      link: `/bulletin/admin`,
    })));
  }

  revalidatePath("/orgs");
  return { ok: true, slug };
}

export async function joinOrg(orgId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase.from("org_members").insert({
    org_id: orgId,
    user_id: user.id,
    role: "member",
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false as const, error: "You already have a pending or active membership." };
    }
    return { ok: false as const, error: error.message };
  }

  const [{ data: org }, { data: directors }, { data: me }] = await Promise.all([
    supabase.from("orgs").select("name, slug").eq("id", orgId).single(),
    supabase.from("org_members").select("user_id").eq("org_id", orgId).eq("role", "director").eq("status", "active"),
    supabase.from("users").select("full_name, email").eq("id", user.id).single(),
  ]);
  if (org && directors && directors.length > 0) {
    const myName = me?.full_name ?? user.email ?? "Someone";
    await notify(directors.map((d) => ({
      userId: d.user_id,
      type: "org_member_request",
      title: `New join request for ${org.name}`,
      body: `${myName} wants to join`,
      link: `/orgs/${org.slug}`,
    })));
  }

  revalidatePath("/orgs");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function leaveOrg(orgId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("org_members")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", user.id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/orgs");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function approveMember(orgId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("org_members")
    .update({ status: "active" })
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .eq("status", "pending");

  if (error) return { ok: false as const, error: error.message };

  const { data: org } = await supabase.from("orgs").select("name, slug").eq("id", orgId).single();
  if (org) {
    await notify([{ userId, type: "org_member_request", title: `You're now a member of ${org.name}!`, link: `/orgs/${org.slug}` }]);
  }

  revalidatePath(`/orgs`);
  return { ok: true as const };
}

export async function denyMember(orgId: string, userId: string) {
  const supabase = await createClient();

  const { data: org } = await supabase.from("orgs").select("name").eq("id", orgId).single();

  const { error } = await supabase
    .from("org_members")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .eq("status", "pending");

  if (error) return { ok: false as const, error: error.message };

  if (org) {
    await notify([{ userId, type: "org_member_request", title: `Join request for ${org.name} was declined` }]);
  }

  revalidatePath(`/orgs`);
  return { ok: true as const };
}

export async function promoteMember(orgId: string, userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: myMem } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!myMem || myMem.role !== "director") {
    return { ok: false as const, error: "Only STAFF can promote members." };
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from("org_members")
    .update({ role: "director" })
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) return { ok: false as const, error: error.message };

  const { data: org } = await supabase.from("orgs").select("name, slug").eq("id", orgId).single();
  if (org) {
    await notify([{ userId, type: "org_member_request", title: `You're now STAFF of ${org.name}!`, link: `/orgs/${org.slug}` }]);
  }

  revalidatePath(`/orgs`);
  return { ok: true as const };
}

export async function updateOrg(
  orgId: string,
  orgSlug: string,
  data: { name: string; description: string; tags: string[] }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: myMem } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!myMem || myMem.role !== "director") {
    return { ok: false as const, error: "Only STAFF can edit the org." };
  }

  if (data.name.length < 2) return { ok: false as const, error: "Name is too short." };

  const svc = createServiceClient();
  const { error } = await svc
    .from("orgs")
    .update({ name: data.name, description: data.description || null, tags: data.tags })
    .eq("id", orgId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/orgs/${orgSlug}`);
  revalidatePath("/orgs");
  return { ok: true as const };
}

export async function removeMember(orgId: string, targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: myMem } = await supabase
    .from("org_members").select("role")
    .eq("org_id", orgId).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!myMem || myMem.role !== "director") {
    return { ok: false as const, error: "Only STAFF can remove members." };
  }

  const { data: targetMem } = await supabase
    .from("org_members").select("role")
    .eq("org_id", orgId).eq("user_id", targetUserId).eq("status", "active").maybeSingle();
  if (!targetMem) return { ok: false as const, error: "Member not found." };
  if (targetMem.role === "director") return { ok: false as const, error: "Cannot remove STAFF members." };

  const svc = createServiceClient();
  const { error } = await svc.from("org_members").delete()
    .eq("org_id", orgId).eq("user_id", targetUserId).eq("status", "active");

  if (error) return { ok: false as const, error: error.message };

  const { data: org } = await supabase.from("orgs").select("name").eq("id", orgId).single();
  if (org) {
    await notify([{ userId: targetUserId, type: "org_member_request", title: `You've been removed from ${org.name}` }]);
  }

  revalidatePath(`/orgs`);
  return { ok: true as const };
}

// ── Invite links ─────────────────────────────────────────────────────────────

export async function generateInvite(orgId: string, orgSlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: myMem } = await supabase.from("org_members").select("role")
    .eq("org_id", orgId).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!myMem || myMem.role !== "director") return { ok: false as const, error: "Only STAFF can generate invite links." };

  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const svc = createServiceClient();

  // Replace any existing invite for this org
  await svc.from("org_invites").delete().eq("org_id", orgId);
  const { data, error } = await svc.from("org_invites")
    .insert({ org_id: orgId, created_by: user.id, code })
    .select("id, code")
    .single();

  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/orgs/${orgSlug}`);
  return { ok: true as const, code: data.code, inviteId: data.id };
}

export async function deleteInvite(inviteId: string, orgSlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const svc = createServiceClient();
  const { data: invite } = await svc.from("org_invites").select("org_id").eq("id", inviteId).single();
  if (!invite) return { ok: false as const, error: "Not found." };

  const { data: myMem } = await supabase.from("org_members").select("role")
    .eq("org_id", invite.org_id).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!myMem || myMem.role !== "director") return { ok: false as const, error: "Not authorized." };

  await svc.from("org_invites").delete().eq("id", inviteId);

  revalidatePath(`/orgs/${orgSlug}`);
  return { ok: true as const };
}

export async function setMemberTitle(orgId: string, targetUserId: string, title: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: myMem } = await supabase.from("org_members").select("role")
    .eq("org_id", orgId).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!myMem || myMem.role !== "director") return { ok: false as const, error: "Only STAFF can set titles." };

  const svc = createServiceClient();
  const { error } = await svc.from("org_members")
    .update({ title: title.trim() || null })
    .eq("org_id", orgId).eq("user_id", targetUserId).eq("status", "active");

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/orgs`);
  return { ok: true as const };
}

export async function uploadOrgLogo(orgId: string, orgSlug: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: myMem } = await supabase.from("org_members").select("role")
    .eq("org_id", orgId).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!myMem || myMem.role !== "director") return { ok: false as const, error: "Only STAFF can upload logos." };

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) return { ok: false as const, error: "No file provided." };
  if (file.size > 2 * 1024 * 1024) return { ok: false as const, error: "Logo must be under 2MB." };
  if (!file.type.startsWith("image/")) return { ok: false as const, error: "File must be an image." };

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${orgId}/logo.${ext}`;
  const bytes = await file.arrayBuffer();

  const svc = createServiceClient();
  const { error: upErr } = await svc.storage.from("org-logos").upload(path, bytes, {
    contentType: file.type,
    upsert: true,
  });
  if (upErr) return { ok: false as const, error: upErr.message };

  const { data: { publicUrl } } = svc.storage.from("org-logos").getPublicUrl(path);
  const { error } = await svc.from("orgs").update({ logo_url: publicUrl }).eq("id", orgId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/orgs/${orgSlug}`);
  return { ok: true as const, url: publicUrl };
}

export async function addAffiliation(orgId: string, orgSlug: string, affiliateOrgId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: myMem } = await supabase.from("org_members").select("role")
    .eq("org_id", orgId).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!myMem || myMem.role !== "director") return { ok: false as const, error: "Only STAFF can manage affiliations." };

  const svc = createServiceClient();
  await svc.from("org_affiliations").insert([
    { org_id: orgId, affiliate_org_id: affiliateOrgId },
    { org_id: affiliateOrgId, affiliate_org_id: orgId },
  ]);

  revalidatePath(`/orgs/${orgSlug}`);
  return { ok: true as const };
}

export async function removeAffiliation(orgId: string, orgSlug: string, affiliateOrgId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: myMem } = await supabase.from("org_members").select("role")
    .eq("org_id", orgId).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!myMem || myMem.role !== "director") return { ok: false as const, error: "Only STAFF can manage affiliations." };

  const svc = createServiceClient();
  await svc.from("org_affiliations").delete()
    .or(`and(org_id.eq.${orgId},affiliate_org_id.eq.${affiliateOrgId}),and(org_id.eq.${affiliateOrgId},affiliate_org_id.eq.${orgId})`);

  revalidatePath(`/orgs/${orgSlug}`);
  return { ok: true as const };
}

export async function approveOrg(orgId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: profile } = await supabase.from("users").select("is_site_admin").eq("id", user.id).single();
  if (!profile?.is_site_admin) return { ok: false as const, error: "Not authorized." };

  const svc = createServiceClient();
  const { data: org } = await svc.from("orgs").select("name, slug").eq("id", orgId).single();
  await svc.from("orgs").update({ status: "approved" }).eq("id", orgId);

  const { data: founder } = await svc.from("org_members")
    .select("user_id").eq("org_id", orgId).eq("role", "director").eq("status", "active").limit(1).single();
  if (founder && org) {
    await notify([{ userId: founder.user_id, type: "org_member_request", title: `Your org "${org.name}" has been approved!`, link: `/orgs/${org.slug}` }]);
  }

  revalidatePath("/bulletin/admin");
  revalidatePath("/orgs");
  return { ok: true as const };
}

export async function rejectOrg(orgId: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: profile } = await supabase.from("users").select("is_site_admin").eq("id", user.id).single();
  if (!profile?.is_site_admin) return { ok: false as const, error: "Not authorized." };

  const svc = createServiceClient();
  const { data: org } = await svc.from("orgs").select("name").eq("id", orgId).single();
  await svc.from("orgs").update({ status: "rejected", rejection_reason: reason || null }).eq("id", orgId);

  const { data: founder } = await svc.from("org_members")
    .select("user_id").eq("org_id", orgId).eq("role", "director").eq("status", "active").limit(1).single();
  if (founder && org) {
    await notify([{ userId: founder.user_id, type: "org_member_request", title: `Org request for "${org.name}" was declined`, body: reason || undefined }]);
  }

  revalidatePath("/bulletin/admin");
  revalidatePath("/orgs");
  return { ok: true as const };
}

export async function acceptInvite(code: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const svc = createServiceClient();
  const { data: invite } = await svc.from("org_invites")
    .select("id, org_id, use_count, orgs(slug)")
    .eq("code", code).single();
  if (!invite) return { ok: false as const, error: "Invalid or expired invite link." };

  const orgSlug = (invite.orgs as unknown as { slug: string } | null)?.slug ?? "";

  const { data: existing } = await supabase.from("org_members")
    .select("status").eq("org_id", invite.org_id).eq("user_id", user.id).maybeSingle();

  if (existing?.status === "active") return { ok: false as const, error: "You're already a member of this org." };

  if (existing?.status === "pending") {
    await svc.from("org_members").update({ status: "active" }).eq("org_id", invite.org_id).eq("user_id", user.id);
  } else {
    const { error } = await svc.from("org_members").insert({ org_id: invite.org_id, user_id: user.id, role: "member", status: "active" });
    if (error) return { ok: false as const, error: error.message };
  }

  await svc.from("org_invites").update({ use_count: (invite.use_count ?? 0) + 1 }).eq("id", invite.id);

  revalidatePath(`/orgs/${orgSlug}`);
  revalidatePath("/dashboard");
  return { ok: true as const, orgSlug };
}
