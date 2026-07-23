import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JoinLeaveButton } from "./_join-leave";

export const dynamic = "force-dynamic";

export default async function OrgProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: org } = await supabase
    .from("orgs")
    .select("id, slug, name, description, created_at")
    .eq("slug", slug)
    .single();

  if (!org) notFound();

  const [{ data: members }, { data: meetings }, { data: myMembership }] =
    await Promise.all([
      supabase
        .from("org_members")
        .select("role, users(id, full_name, email)")
        .eq("org_id", org.id),
      supabase
        .from("meetings")
        .select("id, title, starts_at, location, slots_open")
        .eq("org_id", org.id)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(10),
      user
        ? supabase
            .from("org_members")
            .select("role")
            .eq("org_id", org.id)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const directors =
    members
      ?.filter((m) => m.role === "director")
      .map((m) => m.users as unknown as { id: string; full_name: string | null; email: string })
      ?? [];

  const memberCount = members?.length ?? 0;
  const myRole = myMembership?.role as
    | "member"
    | "officer"
    | "director"
    | undefined;
  const isMember = !!myRole;
  const canManage = myRole === "director" || myRole === "officer";

  return (
    <div className="space-y-8">
      <div>
        <Link href="/orgs" className="text-sm text-gray-500 hover:text-brand">
          ← Orgs
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{org.name}</h1>
            {org.description && (
              <p className="text-gray-700 mt-2 max-w-2xl">{org.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              {memberCount} member{memberCount === 1 ? "" : "s"}
              {directors.length > 0 && (
                <>
                  {" · directors: "}
                  {directors
                    .map((d) => d.full_name ?? d.email.split("@")[0])
                    .join(", ")}
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <JoinLeaveButton
              orgId={org.id}
              isMember={isMember}
              isDirector={myRole === "director"}
            />
            {canManage && (
              <Link
                href={`/orgs/${org.slug}/meetings/new`}
                className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-center hover:bg-gray-50"
              >
                + New meeting
              </Link>
            )}
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-3">Upcoming meetings</h2>
        {!meetings || meetings.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-600 text-sm">
            No meetings scheduled.
            {canManage &&
              " Officers or directors can add one (Phase 5)."}
          </div>
        ) : (
          <ul className="space-y-2">
            {meetings.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/orgs/${org.slug}/meetings/${m.id}`}
                  className="block border border-gray-200 rounded-lg p-4 hover:border-brand transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{m.title}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(m.starts_at).toLocaleString()}
                        {m.location && ` · ${m.location}`}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {m.slots_open} slot{m.slots_open === 1 ? "" : "s"} open
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
