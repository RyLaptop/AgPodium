import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { AcceptInviteButton } from "./_accept";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const svc = createServiceClient();

  const [{ data: { user } }, { data: invite }] = await Promise.all([
    supabase.auth.getUser(),
    svc
      .from("org_invites")
      .select("id, org_id, orgs(name, slug, description)")
      .eq("code", code)
      .single(),
  ]);

  if (!invite) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-3">
        <h1 className="text-2xl font-bold text-gray-800">Invalid invite link</h1>
        <p className="text-gray-500">This link may have been revoked or doesn't exist.</p>
        <Link href="/orgs" className="text-brand hover:underline text-sm">Browse orgs →</Link>
      </div>
    );
  }

  const org = invite.orgs as unknown as { name: string; slug: string; description: string | null };

  const { data: existing } = user
    ? await supabase
        .from("org_members")
        .select("status")
        .eq("org_id", invite.org_id)
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="max-w-md mx-auto py-16 space-y-8">
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">You're invited to join</p>
        <h1 className="text-4xl font-bold text-brand">{org.name}</h1>
        {org.description && (
          <p className="text-gray-600 mt-2 max-w-sm mx-auto">{org.description}</p>
        )}
      </div>

      <div className="border border-gray-200 rounded-xl p-6 text-center space-y-4">
        {!user ? (
          <>
            <p className="text-gray-600 text-sm">Sign in to accept this invite.</p>
            <Link
              href={`/login?next=/invite/${code}`}
              className="inline-block px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark font-medium"
            >
              Sign in to join
            </Link>
          </>
        ) : existing?.status === "active" ? (
          <>
            <p className="text-green-700 font-medium">You're already a member of {org.name}.</p>
            <Link
              href={`/orgs/${org.slug}`}
              className="inline-block px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark text-sm"
            >
              Go to org page →
            </Link>
          </>
        ) : (
          <AcceptInviteButton code={code} orgName={org.name} orgSlug={org.slug} />
        )}
      </div>
    </div>
  );
}
