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

  const { data: memberships } = await supabase
    .from("org_members")
    .select("orgs(id, name)")
    .eq("user_id", user.id);

  const myOrgs =
    memberships?.map((m) => m.orgs as unknown as { id: string; name: string }) ?? [];

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-3xl font-bold">Submit an event</h1>
      <p className="text-gray-600 text-sm">
        Goes to a site admin for review before it shows up on the bulletin
        board.
      </p>
      <SubmitBulletinForm myOrgs={myOrgs} />
    </div>
  );
}
