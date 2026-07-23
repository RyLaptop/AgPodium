import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null; // Layout redirects; this is just for TS.

  const { data: memberships } = await supabase
    .from("org_members")
    .select("role, orgs(id, slug, name, description)")
    .eq("user_id", user.id);

  const orgCount = memberships?.length ?? 0;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold">Welcome back.</h1>
        <p className="text-gray-600 mt-1">
          Signed in as {user.email}.
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your orgs</h2>
          <Link
            href="/orgs/new"
            className="text-sm text-brand hover:underline"
          >
            + Create org
          </Link>
        </div>

        {orgCount === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center space-y-2">
            <p className="text-gray-600">You&apos;re not in any orgs yet.</p>
            <div className="flex gap-3 justify-center text-sm">
              <Link href="/orgs" className="text-brand hover:underline">
                Browse orgs
              </Link>
              <span className="text-gray-400">·</span>
              <Link href="/orgs/new" className="text-brand hover:underline">
                Create one
              </Link>
            </div>
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-4">
            {memberships?.map((m) => {
              // Supabase types will make this cleaner once you run `npm run db:types`
              const org = m.orgs as unknown as {
                id: string;
                slug: string;
                name: string;
                description: string | null;
              };
              return (
                <li
                  key={org.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{org.name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                      {m.role}
                    </span>
                  </div>
                  {org.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {org.description}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        <Link
          href="/orgs"
          className="border border-gray-200 rounded-lg p-4 hover:border-brand hover:shadow transition"
        >
          <h3 className="font-semibold">Browse orgs</h3>
          <p className="text-sm text-gray-500 mt-1">
            Find meetings to speak at
          </p>
        </Link>
        <Link
          href="/requests"
          className="border border-gray-200 rounded-lg p-4 hover:border-brand hover:shadow transition"
        >
          <h3 className="font-semibold">Requests</h3>
          <p className="text-sm text-gray-500 mt-1">
            Track your requests and review incoming
          </p>
        </Link>
        <PhaseCard
          title="Bulletin board"
          desc="Post big campus events"
          coming="Phase 7"
        />
      </section>
    </div>
  );
}

function PhaseCard({
  title,
  desc,
  coming,
}: {
  title: string;
  desc: string;
  coming: string;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h3 className="font-semibold text-gray-700">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
      <p className="text-xs text-gray-400 mt-3">{coming}</p>
    </div>
  );
}
