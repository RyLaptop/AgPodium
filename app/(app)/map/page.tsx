import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { MapWrapper } from "./_map-wrapper";

export const dynamic = "force-dynamic";

type MapMeeting = {
  id: string;
  title: string;
  org_name: string;
  org_slug: string;
  location: string | null;
  starts_at: string;
  lat: number | null;
  lng: number | null;
};

export default async function MapPage() {
  const supabase = await createClient();
  const svc = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get orgs the user is in
  const { data: memberships } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .eq("status", "active");

  const orgIds = (memberships ?? []).map((m) => m.org_id as string);

  // Get orgs the user is speaking at (approved requests)
  const { data: myRequests } = await supabase
    .from("speak_requests")
    .select("meeting_id")
    .eq("requester_user_id", user.id)
    .eq("status", "approved");

  const speakingMeetingIds = (myRequests ?? []).map((r) => r.meeting_id as string);

  // Fetch upcoming meetings for user's orgs
  const queries: Promise<{ data: unknown[] | null }>[] = [];

  if (orgIds.length > 0) {
    queries.push(
      svc.from("meetings")
        .select("id, title, location, starts_at, org_id, orgs(name, slug)")
        .in("org_id", orgIds)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(50) as unknown as Promise<{ data: unknown[] | null }>
    );
  }

  if (speakingMeetingIds.length > 0) {
    queries.push(
      svc.from("meetings")
        .select("id, title, location, starts_at, org_id, orgs(name, slug)")
        .in("id", speakingMeetingIds)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(50) as unknown as Promise<{ data: unknown[] | null }>
    );
  }

  const results = queries.length > 0 ? await Promise.all(queries) : [];
  const allRows = results.flatMap((r) => (r.data ?? []) as Record<string, unknown>[]);

  // Deduplicate by meeting id
  const seen = new Set<string>();
  const meetings: MapMeeting[] = [];
  for (const row of allRows) {
    if (seen.has(row.id as string)) continue;
    seen.add(row.id as string);
    const org = row.orgs as { name: string; slug: string } | null;
    meetings.push({
      id: row.id as string,
      title: row.title as string,
      org_name: org?.name ?? "",
      org_slug: org?.slug ?? "",
      location: (row.location as string | null) ?? null,
      starts_at: row.starts_at as string,
      lat: null,
      lng: null,
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Campus map</h1>
        <p className="text-gray-600 mt-1 text-sm">
          Upcoming meetings for orgs you&apos;re in or speaking at.
        </p>
      </div>

      {meetings.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
          <p>No upcoming meetings. <Link href="/orgs" className="text-brand hover:underline">Browse orgs</Link> to join some.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Map */}
          <div className="w-full rounded-xl overflow-hidden border border-gray-200" style={{ height: "420px" }}>
            <MapWrapper meetings={meetings} />
          </div>

          {/* Legend / list */}
          <div className="grid sm:grid-cols-2 gap-3">
            {meetings.map((m) => (
              <Link
                key={m.id}
                href={`/orgs/${m.org_slug}/meetings/${m.id}`}
                className="border border-gray-200 rounded-lg p-3 hover:border-brand transition"
              >
                <p className="font-medium text-sm truncate">{m.org_name} · {m.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(m.starts_at).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
                {m.location && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(m.location + " Texas A&M University")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-brand hover:underline mt-0.5 block"
                  >
                    📍 {m.location}
                  </a>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
