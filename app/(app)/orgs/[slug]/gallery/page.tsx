import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PostForm } from "./_post-form";
import { DeletePostButton } from "./_delete-post";

export const dynamic = "force-dynamic";

export default async function OrgGalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const svc = createServiceClient();
  const { data: org } = await svc.from("orgs").select("id, name, slug, status").eq("slug", slug).single();
  if (!org || org.status !== "approved") notFound();

  const { data: myMembership } = user
    ? await supabase.from("org_members").select("role, status").eq("org_id", org.id).eq("user_id", user.id).maybeSingle()
    : { data: null };

  const isStaff = myMembership?.status === "active" && (myMembership.role === "director" || myMembership.role === "officer");

  const { data: posts } = await svc
    .from("org_posts")
    .select("id, caption, image_url, created_at, users(full_name)")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href={`/orgs/${slug}`} className="text-sm text-brand hover:underline">← Back to {org.name}</Link>
          <h1 className="text-2xl font-bold mt-1">{org.name} · Gallery</h1>
        </div>
        {isStaff && <PostForm orgId={org.id} orgSlug={org.slug} />}
      </div>

      {(!posts || posts.length === 0) ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-500">
          <p className="font-medium">No posts yet.</p>
          {isStaff && <p className="text-sm mt-1">Staff can add posts using the button above.</p>}
        </div>
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => {
            const author = post.users as unknown as { full_name: string | null } | null;
            const canDelete = isStaff;
            return (
              <li key={post.id} className="border border-gray-200 rounded-xl overflow-hidden">
                {post.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.image_url} alt="" className="w-full max-h-96 object-cover" />
                )}
                <div className="p-4 space-y-1">
                  {post.caption && <p className="text-sm text-gray-800 whitespace-pre-wrap">{post.caption}</p>}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-xs text-gray-400">
                      {author?.full_name ?? "Staff"} · {new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    {canDelete && <DeletePostButton postId={post.id} orgId={org.id} orgSlug={org.slug} />}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
