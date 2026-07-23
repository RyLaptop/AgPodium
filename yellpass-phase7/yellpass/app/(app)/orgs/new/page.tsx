"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createOrg, type CreateOrgResult } from "../actions";

export default function NewOrgPage() {
  const [state, action, pending] = useActionState<
    CreateOrgResult | null,
    FormData
  >(createOrg, null);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link href="/orgs" className="text-sm text-gray-500 hover:text-brand">
          ← Orgs
        </Link>
        <h1 className="text-3xl font-bold mt-2">Create org</h1>
        <p className="text-gray-600 mt-1">
          You&apos;ll be added as the founding director. You can invite others later.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Name</span>
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            placeholder="Foodies For A Cause"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">URL slug</span>
          <input
            name="slug"
            required
            pattern="[a-z0-9\-]{2,40}"
            placeholder="ffac"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <span className="text-xs text-gray-500 mt-1 block">
            Lowercase letters, numbers, dashes. Used in the URL: yellpass.app/orgs/<em>slug</em>
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Description</span>
          <textarea
            name="description"
            rows={4}
            maxLength={500}
            placeholder="What is this org about? Who should join?"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create org"}
          </button>
          <Link
            href="/orgs"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>

        {state && !state.ok && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
      </form>
    </div>
  );
}
