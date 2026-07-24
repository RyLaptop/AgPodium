import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { OrgSearch } from "./_search";

export const dynamic = "force-dynamic";

type OrgRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  member_count: number;
  tags: string[];
  logo_url: string | null;
  next_meeting_at: string | null;
  next_meeting_day: number | null;
};

export default async function OrgsPage() {
  const supabase = await createClient();
  const svc = createServiceClient();

  const [{ data: orgs }, { data: activeMembers }, { data: upcomingMeetings }] = await Promise.all([
    svc.from("orgs").select("id, slug, name, description, tags, logo_url").eq("status", "approved").order("name"),
    supabase.from("org_members").select("org_id").eq("status", "active"),
    svc.from("meetings")
      .select("org_id, starts_at")
      .gte("starts_at", new Date().toISOString())
      .is("cancelled_at", null)
      .order("starts_at", { ascending: true }),
  ]);

  const countByOrg = new Map<string, number>();
  for (const m of activeMembers ?? []) {
    countByOrg.set(m.org_id, (countByOrg.get(m.org_id) ?? 0) + 1);
  }

  // First upcoming meeting per org
  const nextMeetingByOrg = new Map<string, { at: string; day: number }>();
  for (const m of upcomingMeetings ?? []) {
    if (!nextMeetingByOrg.has(m.org_id)) {
      nextMeetingByOrg.set(m.org_id, {
        at: m.starts_at,
        day: new Date(m.starts_at).getDay(),
      });
    }
  }

  const withCounts: OrgRow[] = (orgs ?? []).map((o) => ({
    id: o.id,
    slug: o.slug,
    name: o.name,
    description: o.description,
    tags: (o.tags as unknown as string[]) ?? [],
    member_count: countByOrg.get(o.id) ?? 0,
    logo_url: o.logo_url ?? null,
    next_meeting_at: nextMeetingByOrg.get(o.id)?.at ?? null,
    next_meeting_day: nextMeetingByOrg.get(o.id)?.day ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orgs</h1>
          <p className="text-gray-600 mt-1">
            Browse orgs, join, or request a speaking slot at their meetings.
          </p>
        </div>
        <Link
          href="/orgs/new"
          className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark text-sm shrink-0"
        >
          + Create org
        </Link>
      </div>

      <OrgSearch orgs={withCounts} />
    </div>
  );
}
