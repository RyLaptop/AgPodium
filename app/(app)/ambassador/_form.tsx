"use client";

import { useState, useTransition } from "react";
import { submitAmbassadorApplication } from "./actions";

type OrgEntry = { name: string; website: string; instagram: string; description: string };

const emptyOrg = (): OrgEntry => ({ name: "", website: "", instagram: "", description: "" });

export function AmbassadorForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");
  const [orgs, setOrgs] = useState<OrgEntry[]>([emptyOrg()]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const updateOrg = (index: number, field: keyof OrgEntry, value: string) => {
    setOrgs((prev) => prev.map((o, i) => (i === index ? { ...o, [field]: value } : o)));
  };

  const addOrg = () => setOrgs((prev) => [...prev, emptyOrg()]);
  const removeOrg = (index: number) => setOrgs((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submitAmbassadorApplication(fullName, email, phone, university, orgs);
      if (res.ok) setSubmitted(true);
      else setError(res.error);
    });
  };

  if (submitted) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-xl p-6 text-center space-y-2">
        <p className="text-green-700 font-semibold text-lg">Application received!</p>
        <p className="text-green-600 text-sm">
          We&apos;ll be in touch at <strong>{email}</strong> to discuss bringing UniPodium to {university}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Full name <span className="text-red-500">*</span></span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Jane Smith"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Email <span className="text-red-500">*</span></span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="jane@myuniversity.edu"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Phone</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 000-0000"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">University <span className="text-red-500">*</span></span>
          <input
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            required
            placeholder="e.g. University of Florida"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Orgs you&apos;re involved with</h3>
          <button
            type="button"
            onClick={addOrg}
            className="text-sm text-brand hover:underline"
          >
            + Add another org
          </button>
        </div>

        <div className="space-y-4">
          {orgs.map((org, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Org {i + 1}</span>
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => removeOrg(i)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
              <label className="block">
                <span className="text-xs font-medium text-gray-600">Org name <span className="text-red-500">*</span></span>
                <input
                  value={org.name}
                  onChange={(e) => updateOrg(i, "name", e.target.value)}
                  required={i === 0}
                  placeholder="Aggie Debate Society"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Website</span>
                  <input
                    type="url"
                    value={org.website}
                    onChange={(e) => updateOrg(i, "website", e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Instagram</span>
                  <input
                    type="url"
                    value={org.instagram}
                    onChange={(e) => updateOrg(i, "instagram", e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-gray-600">Brief description</span>
                <textarea
                  value={org.description}
                  onChange={(e) => updateOrg(i, "description", e.target.value)}
                  rows={2}
                  placeholder="What does this org do? How often do you meet?"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark disabled:opacity-60 transition"
      >
        {pending ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
