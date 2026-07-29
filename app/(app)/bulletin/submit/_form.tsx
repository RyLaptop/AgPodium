"use client";

import { useActionState } from "react";
import {
  submitBulletinPost,
  type SubmitBulletinResult,
} from "../actions";

export function SubmitBulletinForm({
  myOrgs,
}: {
  myOrgs: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<
    SubmitBulletinResult | null,
    FormData
  >(submitBulletinPost, null);

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Event title</span>
        <input
          name="event_title"
          required
          minLength={3}
          maxLength={150}
          placeholder="Big Event 2026"
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Description</span>
        <textarea
          name="event_description"
          rows={4}
          maxLength={1000}
          placeholder="What's happening?"
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Date & time</span>
        <input
          type="datetime-local"
          name="event_at"
          required
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Location</span>
        <input
          name="event_location"
          maxLength={200}
          placeholder="Rudder Plaza"
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      {myOrgs.length > 0 && (
        <label className="block">
          <span className="text-sm font-medium">Submitting on behalf of</span>
          <select
            name="org_id"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Just me (no org)</option>
            {myOrgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="border-t border-gray-100 pt-4 space-y-4">
        <p className="text-sm font-semibold text-gray-700">Images <span className="font-normal text-gray-400">(optional)</span></p>

        <label className="block">
          <span className="text-sm font-medium">Thumbnail <span className="font-normal text-gray-400">— small image shown in the carousel and bulletin list</span></span>
          <input
            type="file"
            name="thumbnail"
            accept="image/*"
            className="mt-1 w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:rounded-lg file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50 file:cursor-pointer"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Banner <span className="font-normal text-gray-400">— large image shown on the event detail page</span></span>
          <input
            type="file"
            name="banner"
            accept="image/*"
            className="mt-1 w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:rounded-lg file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50 file:cursor-pointer"
          />
        </label>
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-4">
        <p className="text-sm font-semibold text-gray-700">Links <span className="font-normal text-gray-400">(optional)</span></p>

        <label className="block">
          <span className="text-sm font-medium">Website URL</span>
          <input
            name="website_url"
            type="url"
            placeholder="https://example.com"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Instagram URL</span>
          <input
            name="instagram_url"
            type="url"
            placeholder="https://instagram.com/yourhandle"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit for review"}
      </button>

      {state && !state.ok && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
