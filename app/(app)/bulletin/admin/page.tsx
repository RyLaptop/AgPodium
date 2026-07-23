import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewQueue } from "./_review-queue";

export const dynamic = "force-dynamic";

export default async function BulletinAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("is_site_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_site_admin) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold">Not authorized</h1>
        <p className="text-gray-600 mt-2 text-sm">
          Site admin only. Ask Rylan to flip your{" "}
          <code className="text-xs bg-gray-100 px-1 rounded">
            is_site_admin
          </code>{" "}
          flag.
        </p>
      </div>
    );
  }

  const { data: pending } = await supabase
    .from("bulletin_posts")
    .select(
      "id, event_title, event_description, event_at, event_location, created_at, users(full_name, email), orgs(name)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Bulletin review queue</h1>
      <ReviewQueue posts={pending ?? []} />
    </div>
  );
}
