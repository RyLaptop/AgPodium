import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getUniversity } from "@/lib/university";
import type { BoothEventRow } from "@/lib/open-house";
import { BoothDetail } from "./_booth-detail";

export const dynamic = "force-dynamic";

export default async function BoothPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const svc = createServiceClient();
  const supabase = await createClient();
  const uni = await getUniversity();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: boothRow } = await svc
    .from("org_booths")
    .select("id, org_id, elevator_pitch, video_url, website_url, instagram_url, tiktok_url, cover_image_url, image_urls, category, orgs!inner(name, slug, logo_url, university)")
    .eq("orgs.slug", orgSlug)
    .eq("orgs.university", uni)
    .maybeSingle();

  if (!boothRow) notFound();

  const org = boothRow.orgs as unknown as { name: string; slug: string; logo_url: string | null };

  const [{ data: events }, { data: stamp }] = await Promise.all([
    svc.from("booth_events").select("id, title, event_at, location, description").eq("org_id", boothRow.org_id).order("event_at"),
    user
      ? supabase.from("passport_stamps").select("video_watched, link_clicked, event_added").eq("user_id", user.id).eq("org_id", boothRow.org_id).maybeSingle()
      : { data: null },
  ]);

  const boothEvents: BoothEventRow[] = (events ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    event_at: e.event_at,
    location: e.location as string | null,
    description: e.description as string | null,
  }));

  return (
    <BoothDetail
      booth={{
        id: boothRow.id,
        org_id: boothRow.org_id,
        org_name: org.name,
        org_slug: org.slug,
        org_logo_url: org.logo_url,
        elevator_pitch: boothRow.elevator_pitch as string | null,
        video_url: boothRow.video_url as string | null,
        website_url: boothRow.website_url as string | null,
        instagram_url: boothRow.instagram_url as string | null,
        tiktok_url: boothRow.tiktok_url as string | null,
        cover_image_url: boothRow.cover_image_url as string | null,
        image_urls: (boothRow.image_urls as string[]) ?? [],
        category: boothRow.category as string | null,
      }}
      events={boothEvents}
      initialStamp={stamp ?? null}
      isAuthed={!!user}
    />
  );
}
