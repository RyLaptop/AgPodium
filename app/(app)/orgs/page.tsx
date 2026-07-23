import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { OrgSearch } from "./_search";

export const dynamic = "force-dynamic";

type OrgRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  member_count: number;
  tags: string[];
};

export default async function OrgsPage() {
  const supabase = await createClient();

  const [{ data: orgs }, { data: activeMembers }] = await Promise.all([
    supabase.from("orgs").select("id, slug, name, description, tags").order("name"),
    supabase.from("org_members").select("org_id").eq("status", "active"),
  ]);

  const countByOrg = new Map<string, number>();
  for (const m of activeMembers ?? []) {
    countByOrg.set(m.org_id, (countByOrg.get(m.org_id) ?? 0) + 1);
  }

  const withCounts: OrgRow[] = (orgs ?? []).map((o) => ({
    id: o.id,
    slug: o.slug,
    name: o.name,
    description: o.description,
    tags: (o.tags as unknown as string[]) ?? [],
    member_count: countByOrg.get(o.id) ?? 0,
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
          className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark text-sm"
        >
          + Create org
        </Link>
      </div>

      <OrgSearch orgs={withCounts} />
    </div>
  );
}
