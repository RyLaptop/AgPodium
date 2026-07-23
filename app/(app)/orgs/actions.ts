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

  if (tags.length > 0) {
    const svc = createServiceClient();
    await svc.from("orgs").update({ tags }).eq("slug", slug);
  }

  revalidatePath("/orgs");
  redirect(`/orgs/${slug}`);
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
