"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, uploadAvatar } from "../actions";
import { AVATAR_OPTIONS, UserAvatar } from "@/components/user-avatar";

export function EditProfileForm({
  currentName,
  currentBio,
  currentMajor,
  currentAvatarUrl,
}: {
  currentName: string | null;
  currentBio: string | null;
  currentMajor: string | null;
  currentAvatarUrl: string | null;
}) {
  const isPhoto = !!currentAvatarUrl?.startsWith("http");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName ?? "");
  const [bio, setBio] = useState(currentBio ?? "");
  const [major, setMajor] = useState(currentMajor ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(isPhoto ? null : currentAvatarUrl);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(isPhoto ? currentAvatarUrl : null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setAvatarUrl(null);
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const selectEmoji = (key: string) => {
    setAvatarUrl(avatarUrl === key ? null : key);
    clearPhoto();
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      let finalAvatarUrl: string | null;

      if (photoFile) {
        const fd = new FormData();
        fd.append("avatar", photoFile);
        const photoRes = await uploadAvatar(fd);
        if (!photoRes.ok) { setError(photoRes.error); return; }
        finalAvatarUrl = photoRes.url;
      } else if (photoPreview && !photoFile) {
        // Existing photo — keep the original URL
        finalAvatarUrl = currentAvatarUrl;
      } else {
        finalAvatarUrl = avatarUrl;
      }

      const res = await updateProfile({ name, bio, major, avatarUrl: finalAvatarUrl });
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
        Edit profile
      </button>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="font-semibold">Edit profile</h3>

      <div>
        <span className="text-sm font-medium block mb-2">Profile photo</span>
        <div className="flex items-center gap-3">
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Preview" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
          ) : (
            <UserAvatar avatarUrl={avatarUrl} name={name || "?"} size="md" />
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {photoPreview ? "Change photo" : "Upload photo"}
          </button>
          {photoPreview && (
            <button type="button" onClick={clearPhoto} className="text-xs text-red-400 hover:text-red-600">
              Remove
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
        </div>
      </div>

      <div>
        <span className="text-sm font-medium block mb-2">Profile icon</span>
        <div className="flex flex-wrap gap-2">
          {AVATAR_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => selectEmoji(opt.key)}
              title={opt.label}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition ring-2 ${
                avatarUrl === opt.key
                  ? "ring-brand ring-offset-1"
                  : "ring-transparent hover:ring-gray-300"
              } ${opt.bg}`}
            >
              {opt.key}
            </button>
          ))}
          {avatarUrl && !photoPreview && (
            <button
              type="button"
              onClick={() => setAvatarUrl(null)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs text-gray-500 border border-dashed border-gray-300 hover:bg-gray-50"
              title="Remove icon"
            >
              ✕
            </button>
          )}
        </div>
        {avatarUrl && !photoPreview && (
          <p className="text-xs text-gray-400 mt-1">Click again to deselect.</p>
        )}
      </div>

      <label className="block">
        <span className="text-sm font-medium">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Major</span>
        <input
          value={major}
          onChange={(e) => setMajor(e.target.value)}
          placeholder="e.g. Computer Science"
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Bio</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="Tell others about yourself..."
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={pending}
          className="px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => { setOpen(false); setError(null); }}
          disabled={pending}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
