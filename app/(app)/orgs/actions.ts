"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  });

  if (error) return { ok: false as const, error: error.message };

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
