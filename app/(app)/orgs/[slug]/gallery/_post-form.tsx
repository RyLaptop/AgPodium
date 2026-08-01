"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getUploadUrl, createOrgPost } from "./actions";

export function PostForm({ orgId, orgSlug }: { orgId: string; orgSlug: string }) {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0] ?? null;
    if (!caption.trim() && !file) { setError("Add a caption or image."); return; }

    startTransition(async () => {
      try {
        setError(null);
        let imagePath: string | null = null;

        if (file) {
          if (!file.type.startsWith("image/")) { setError("File must be an image."); return; }
          if (file.size > 20 * 1024 * 1024) { setError("Image must be under 20MB."); return; }

          // Get a signed URL from the server (validates staff role), then upload directly
          const urlRes = await getUploadUrl(orgId, file.name, file.type);
          if (!urlRes.ok) { setError(urlRes.error); return; }

          const uploadRes = await fetch(urlRes.signedUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });
          if (!uploadRes.ok) { setError("Image upload failed. Try again."); return; }

          imagePath = urlRes.path;
        }

        const res = await createOrgPost(orgId, orgSlug, caption, imagePath);
        if (!res.ok) { setError(res.error); return; }

        setOpen(false);
        setPreview(null);
        setCaption("");
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark">
        + New post
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="border border-gray-200 rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-sm">New post</h3>

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Write a caption…"
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand"
      />

      <div>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="w-full max-h-64 object-cover rounded-lg mb-2 border border-gray-200" />
        )}
        <button type="button" onClick={() => fileRef.current?.click()}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">
          {preview ? "Change image" : "Add image"}
        </button>
        {preview && (
          <button type="button"
            onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
            className="ml-2 text-xs text-red-400 hover:text-red-600">
            Remove
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={pending}
          className="px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark disabled:opacity-60">
          {pending ? "Posting…" : "Post"}
        </button>
        <button type="button" disabled={pending}
          onClick={() => { setOpen(false); setPreview(null); setError(null); setCaption(""); }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
