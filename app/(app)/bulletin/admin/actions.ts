"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type Result = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { data: profile } = await supabase.from("users").select("is_site_admin").eq("id", user.id).single();
  if (!profile?.is_site_admin) return { error: "Not authorized." };
  return { userId: user.id };
}

export async function adminUpdateUser(
  targetUserId: string,
  formData: FormData
): Promise<Result> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };

  const fullName = (formData.get("full_name") as string | null)?.trim() || null;
  const email = (formData.get("email") as string | null)?.trim() || null;
  const isSiteAdmin = formData.get("is_site_admin") === "true";

  const svc = createServiceClient();

  if (email) {
    const { error } = await svc.auth.admin.updateUserById(targetUserId, { email });
    if (error) return { ok: false, error: error.message };
  }

  const { error: profileErr } = await svc
    .from("users")
    .update({ full_name: fullName, ...(email ? { email } : {}), is_site_admin: isSiteAdmin })
    .eq("id", targetUserId);

  if (profileErr) return { ok: false, error: profileErr.message };
  return { ok: true };
}

export async function adminDeleteUser(targetUserId: string): Promise<Result> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };

  if (auth.userId === targetUserId) return { ok: false, error: "Cannot delete your own account." };

  const svc = createServiceClient();
  const { error } = await svc.auth.admin.deleteUser(targetUserId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
