"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSurvey } from "./actions";

export function DeleteSurveyButton({ surveyId, orgId, orgSlug }: { surveyId: string; orgId: string; orgSlug: string }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  if (!confirm) return <button onClick={() => setConfirm(true)} className="text-xs px-2.5 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Delete</button>;
  return (
    <span className="flex gap-1.5">
      <button onClick={() => startTransition(async () => { await deleteSurvey(surveyId, orgId, orgSlug); router.refresh(); })} disabled={pending} className="text-xs text-red-600 font-medium disabled:opacity-60">{pending ? "…" : "Confirm"}</button>
      <button onClick={() => setConfirm(false)} className="text-xs text-gray-400">Cancel</button>
    </span>
  );
}
