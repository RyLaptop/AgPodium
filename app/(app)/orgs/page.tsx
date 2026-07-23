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
};

export default async function OrgsPage() {
  const supabase = await createClient();

  const { data: orgs } = await supabase
    .from("orgs")
    .select("id, slug, name, description, org_members(count)")
    .order("name");

  const withCounts: OrgRow[] =
    orgs?.map((o) => {
      const members = o.org_members as unknown as { count: number }[];
      return {
        id: o.id,
        slug: o.slug,
        name: o.name,
        description: o.description,
        member_count: members?.[0]?.count ?? 0,
      };
    }) ?? [];

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
