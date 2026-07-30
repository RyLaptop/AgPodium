import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmitBulletinForm } from "./_form";

export const dynamic = "force-dynamic";

export default async function SubmitBulletinPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: memberships }, { data: profile }] = await Promise.all([
    supabase
      .from("org_members")
      .select("orgs(id, name)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .in("role", ["officer", "director"]),
    supabase.from("users").select("is_site_admin").eq("id", user.id).single(),
  ]);

  const isAdmin = profile?.is_site_admin ?? false;
  const myOrgs =
    memberships?.map((m) => m.orgs as unknown as { id: string; name: string }) ?? [];

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-3xl font-bold">Submit an event</h1>
      <p className="text-gray-600 text-sm">
        {isAdmin
          ? "As an admin, your submission is published immediately."
          : "Goes to a site admin for review before it shows up on the bulletin board."}
      </p>
      <SubmitBulletinForm myOrgs={myOrgs} isAdmin={isAdmin} />
    </div>
  );
}
