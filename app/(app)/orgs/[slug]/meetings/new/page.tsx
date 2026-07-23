import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewMeetingForm } from "./_form";

export default async function NewMeetingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("orgs")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!org) notFound();

  // Confirm the user is officer or director of this org
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || membership.role === "member") {
    return (
      <div className="max-w-lg space-y-4">
        <Link href={`/orgs/${slug}`} className="text-sm text-gray-500">
          ← Back to {org.name}
        </Link>
        <div className="border border-red-200 bg-red-50 rounded-lg p-6">
          <h1 className="text-lg font-semibold text-red-900">
            Only officers or directors can create meetings
          </h1>
          <p className="text-sm text-red-800 mt-1">
            Ask a director of {org.name} to promote you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-4">
      <Link href={`/orgs/${slug}`} className="text-sm text-gray-500">
        ← Back to {org.name}
      </Link>
      <h1 className="text-3xl font-bold">New meeting</h1>
      <p className="text-gray-600">for {org.name}</p>
      <NewMeetingForm orgId={org.id} orgSlug={slug} />
    </div>
  );
}
