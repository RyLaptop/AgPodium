"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { editBulletinPost, type EditBulletinResult } from "../../actions";

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Props = {
  post: {
    id: string;
    event_title: string;
    event_description: string;
    event_at: string;
    event_location: string;
    thumbnail_url: string | null;
    banner_url: string | null;
    website_url: string;
    instagram_url: string;
    org_id: string;
  };
  myOrgs: { id: string; name: string }[];
  isAdmin: boolean;
};

export function EditBulletinForm({ post, myOrgs, isAdmin }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<EditBulletinResult | null, FormData>(
    editBulletinPost,
    null
  );

  useEffect(() => {
    if (state?.ok) {
      router.push(`/bulletin/${post.id}`);
    }
  }, [state, router, post.id]);

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-4">
      <input type="hidden" name="post_id" value={post.id} />

      <label className="block">
        <span className="text-sm font-medium">Event title</span>
        <input
          name="event_title"
          required
          minLength={3}
          maxLength={150}
          defaultValue={post.event_title}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Description</span>
        <textarea
          name="event_description"
          rows={4}
          maxLength={1000}
          defaultValue={post.event_description}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Date & time</span>
        <input
          type="datetime-local"
          name="event_at"
          required
          defaultValue={toDatetimeLocal(post.event_at)}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Location</span>
        <input
          name="event_location"
          maxLength={200}
          defaultValue={post.event_location}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      {(isAdmin || myOrgs.length > 0) && (
        <label className="block">
          <span className="text-sm font-medium">Submitting on behalf of</span>
          <select
            name="org_id"
            defaultValue={post.org_id}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Just me (no org)</option>
            {isAdmin && <option value="__university__">The University</option>}
            {myOrgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </label>
      )}

      <div className="border-t border-gray-100 pt-4 space-y-4">
        <p className="text-sm font-semibold text-gray-700">Images <span className="font-normal text-gray-400">(leave blank to keep existing)</span></p>

        {post.thumbnail_url && (
          <div className="flex items-center gap-3">
            <img src={post.thumbnail_url} alt="Current thumbnail" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
            <span className="text-xs text-gray-500">Current thumbnail</span>
          </div>
        )}
        <label className="block">
          <span className="text-sm font-medium">Thumbnail <span className="font-normal text-gray-400">— small image</span></span>
          <input
            type="file"
            name="thumbnail"
            accept="image/*"
            className="mt-1 w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:rounded-lg file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50 file:cursor-pointer"
          />
        </label>

        {post.banner_url && (
          <div className="flex items-center gap-3">
            <img src={post.banner_url} alt="Current banner" className="w-24 h-14 rounded-lg object-cover border border-gray-200" />
            <span className="text-xs text-gray-500">Current banner</span>
          </div>
        )}
        <label className="block">
          <span className="text-sm font-medium">Banner <span className="font-normal text-gray-400">— large image for detail page</span></span>
          <input
            type="file"
            name="banner"
            accept="image/*"
            className="mt-1 w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:rounded-lg file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50 file:cursor-pointer"
          />
        </label>
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-4">
        <p className="text-sm font-semibold text-gray-700">Links</p>

        <label className="block">
          <span className="text-sm font-medium">Website URL</span>
          <input
            name="website_url"
            type="url"
            defaultValue={post.website_url}
            placeholder="https://example.com"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Instagram URL</span>
          <input
            name="instagram_url"
            type="url"
            defaultValue={post.instagram_url}
            placeholder="https://instagram.com/yourhandle"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <a
          href={`/bulletin/${post.id}`}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </a>
      </div>

      {state && !state.ok && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
