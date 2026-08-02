import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isOrgStaff } from "@/lib/auth/org-access";
import { BoothForm } from "./_booth-form";
import type { BoothEventRow } from "@/lib/open-house";

export default async function BoothEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();
  const { data: org } = await svc.from("orgs").select("id, name, slug").eq("slug", slug).single();
  if (!org) notFound();

  if (!await isOrgStaff(supabase, org.id, user.id)) {
    return (
      <div className="max-w-lg py-12 text-center">
        <p className="text-gray-600">Only org staff can edit the booth.</p>
      </div>
    );
  }

  const [{ data: booth }, { data: boothEvents }] = await Promise.all([
    svc.from("org_booths").select("*").eq("org_id", org.id).maybeSingle(),
    svc.from("booth_events").select("id, title, event_at, location, description").eq("org_id", org.id).order("event_at"),
  ]);

  const existing = booth ? {
    elevator_pitch: booth.elevator_pitch as string | null,
    video_url: booth.video_url as string | null,
    website_url: booth.website_url as string | null,
    instagram_url: booth.instagram_url as string | null,
    tiktok_url: booth.tiktok_url as string | null,
    cover_image_url: booth.cover_image_url as string | null,
    image_urls: (booth.image_urls as string[]) ?? [],
    category: booth.category as string | null,
  } : null;

  const events: BoothEventRow[] = (boothEvents ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    event_at: e.event_at,
    location: (e.location as string | null),
    description: (e.description as string | null),
  }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{org.name} — Open House Booth</h1>
        <p className="text-sm text-gray-500 mt-1">
          This is your org&apos;s page during Podium Open House. Fill it out so new students can discover you.
        </p>
      </div>
      <BoothForm orgId={org.id} orgSlug={org.slug} existing={existing} existingEvents={events} />
    </div>
  );
}
