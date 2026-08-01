import type { createClient } from "@/lib/supabase/server";

export async function isOrgStaff(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  userId: string
): Promise<boolean> {
  const [{ data: profile }, { data: member }] = await Promise.all([
    supabase.from("users").select("is_site_admin").eq("id", userId).single(),
    supabase.from("org_members").select("role").eq("org_id", orgId).eq("user_id", userId).eq("status", "active").single(),
  ]);
  if (profile?.is_site_admin) return true;
  return member?.role === "director" || member?.role === "officer";
}
