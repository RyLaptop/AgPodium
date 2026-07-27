"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateOrg, uploadOrgLogo } from "../actions";
import { ORG_TAGS, TAG_COLORS, tagLabel } from "../_tag-colors";

export function EditOrgForm({
  orgId,
  orgSlug,
  currentName,
  currentDescription,
  currentTags,
  currentLogoUrl,
  currentContactEmail,
}: {
  orgId: string;
  orgSlug: string;
  currentName: string;
  currentDescription: string | null;
  currentTags: string[];
  currentLogoUrl?: string | null;
  currentContactEmail?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription ?? "");
  const [tags, setTags] = useState<string[]>(currentTags);
  const [contactEmail, setContactEmail] = useState(currentContactEmail ?? "");
  const [logoPreview, setLogoPreview] = useState<string | null>(currentLogoUrl ?? null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const toggleTag = (tag: string) =>
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      // Upload logo first if selected
      if (logoFile) {
        const fd = new FormData();
        fd.append("logo", logoFile);
        const logoRes = await uploadOrgLogo(orgId, orgSlug, fd);
        if (!logoRes.ok) { setError(logoRes.error); return; }
      }

      const res = await updateOrg(orgId, orgSlug, { name, description, tags, contactEmail: contactEmail.trim() || undefined });
      if (!res.ok) setError(res.error);
      else { setOpen(false); router.refresh(); }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Edit org
      </button>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="font-semibold">Edit org</h3>

      {/* Logo upload */}
      <div>
        <p className="text-sm font-medium mb-2">Logo</p>
        <div className="flex items-center gap-3">
          {logoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoPreview} alt="Logo preview"
              className="w-12 h-12 rounded-full object-cover border border-gray-200" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center border border-gray-200">
              <span className="text-brand font-bold">{currentName[0]}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {logoPreview ? "Change logo" : "Upload logo"}
          </button>
          {logoPreview && (
            <button
              type="button"
              onClick={() => { setLogoPreview(null); setLogoFile(null); }}
              className="text-xs text-red-400 hover:text-red-600"
            >
              Remove
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onLogoChange}
            className="hidden"
          />
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-sm"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-sm resize-none"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Contact email</span>
        <p className="text-xs text-gray-500 mb-1">Receives emails for new speak requests and join requests to this org.</p>
        <input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="officers@myorg.tamu.edu"
          className="mt-0.5 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-sm"
        />
      </label>

      <div>
        <p className="text-sm font-medium mb-2">Tags</p>
        <div className="flex flex-wrap gap-2">
          {ORG_TAGS.map((tag) => (
            <button key={tag} type="button" onClick={() => toggleTag(tag)}
              className={`text-xs px-2.5 py-1 rounded-full border transition ${
                tags.includes(tag)
                  ? (TAG_COLORS[tag]?.active ?? "bg-brand text-white border-brand")
                  : (TAG_COLORS[tag]?.border ?? "border-gray-300 text-gray-600 hover:border-brand hover:text-brand")
              }`}>
              {tagLabel(tag)}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button onClick={submit} disabled={pending}
          className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60 text-sm">
          {pending ? "Saving…" : "Save"}
        </button>
        <button onClick={() => setOpen(false)} disabled={pending}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}
