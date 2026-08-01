import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { Calendar, type CalEvent } from "./_calendar";
import { AdBanner } from "@/components/ad-banner";
import { getUniversity } from "@/lib/university";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const uni = await getUniversity();
  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  from.setDate(1);
  const to = new Date();
  to.setMonth(to.getMonth() + 3);

  const svc = createServiceClient();

  const [{ data: memberships }, { data: bulletinPosts }] = await Promise.all([
    user
      ? supabase
          .from("org_members")
          .select("org_id, orgs!inner(university)")
          .eq("user_id", user.id)
          .eq("status", "active")
          .eq("orgs.university", uni)
      : Promise.resolve({ data: [] }),
    svc
      .from("bulletin_posts")
      .select("event_title, event_at")
      .eq("status", "approved")
      .eq("university", uni)
      .not("event_at", "is", null)
      .gte("event_at", from.toISOString())
      .lte("event_at", to.toISOString()),
  ]);

  const orgIds = (memberships ?? []).map((m) => m.org_id as string);

  const { data: meetings } = orgIds.length > 0
    ? await supabase
        .from("meetings")
        .select("id, title, starts_at, orgs(slug)")
        .in("org_id", orgIds)
        .gte("starts_at", from.toISOString())
        .lte("starts_at", to.toISOString())
        .order("starts_at", { ascending: true })
    : { data: [] };

  const events: CalEvent[] = [
    ...(meetings ?? []).map((m) => {
      const org = m.orgs as unknown as { slug: string } | null;
      return {
        type: "meeting" as const,
        title: m.title,
        time: m.starts_at,
        href: org ? `/orgs/${org.slug}/meetings/${m.id}` : undefined,
      };
    }),
    ...(bulletinPosts ?? []).map((p) => ({
      type: "bulletin" as const,
      title: p.event_title,
      time: p.event_at,
      href: "/bulletin",
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <p className="text-gray-600 mt-1">
          Meetings from your orgs and all upcoming bulletin events.
        </p>
      </div>
      <AdBanner />
      <div className="max-w-2xl">
        <Calendar events={events} />
      </div>
    </div>
  );
}
