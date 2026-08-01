"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSurvey, type Question } from "../actions";

const emptyQ = (): Question => ({ text: "", type: "text", options: [""] });

export function SurveyBuilder({ orgId, orgSlug }: { orgId: string; orgSlug: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([emptyQ()]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const updateQ = (i: number, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q, idx) => idx === i ? { ...q, ...patch } : q));

  const addOption = (qi: number) =>
    setQuestions((qs) => qs.map((q, i) => i === qi ? { ...q, options: [...q.options, ""] } : q));

  const updateOption = (qi: number, oi: number, val: string) =>
    setQuestions((qs) => qs.map((q, i) => i === qi ? { ...q, options: q.options.map((o, j) => j === oi ? val : o) } : q));

  const removeOption = (qi: number, oi: number) =>
    setQuestions((qs) => qs.map((q, i) => i === qi ? { ...q, options: q.options.filter((_, j) => j !== oi) } : q));

  const removeQ = (i: number) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));

  const submit = () => {
    startTransition(async () => {
      setError(null);
      const res = await createSurvey(orgId, orgSlug, title, description, isPublic, questions);
      if (!res.ok) { setError(res.error); return; }
      router.push(`/orgs/${orgSlug}/surveys`);
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3 border border-gray-200 rounded-xl p-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Survey title" className="w-full text-xl font-semibold border-b border-gray-200 pb-2 focus:outline-none focus:border-brand" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full text-sm text-gray-500 resize-none focus:outline-none" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="rounded border-gray-300 text-brand" />
          Public — anyone can fill this out (not just members)
        </label>
      </div>

      <div className="space-y-3">
        {questions.map((q, qi) => (
          <div key={qi} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex gap-2">
              <input
                value={q.text}
                onChange={(e) => updateQ(qi, { text: e.target.value })}
                placeholder={`Question ${qi + 1}`}
                className="flex-1 text-sm font-medium border-b border-gray-200 pb-1 focus:outline-none focus:border-brand"
              />
              <select
                value={q.type}
                onChange={(e) => updateQ(qi, { type: e.target.value as Question["type"], options: e.target.value === "text" ? [] : [""] })}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="text">Short answer</option>
                <option value="multiple_choice">Multiple choice</option>
                <option value="checkbox">Checkboxes</option>
              </select>
              {questions.length > 1 && (
                <button onClick={() => removeQ(qi)} className="text-xs text-red-400 hover:text-red-600 px-1">✕</button>
              )}
            </div>

            {(q.type === "multiple_choice" || q.type === "checkbox") && (
              <div className="space-y-1.5 pl-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">{q.type === "multiple_choice" ? "○" : "☐"}</span>
                    <input
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className="flex-1 text-sm border-b border-gray-200 pb-0.5 focus:outline-none focus:border-brand"
                    />
                    {q.options.length > 1 && (
                      <button onClick={() => removeOption(qi, oi)} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addOption(qi)} className="text-xs text-brand hover:underline mt-1">+ Add option</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={() => setQuestions((qs) => [...qs, emptyQ()])} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-brand hover:text-brand transition">
        + Add question
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button onClick={submit} disabled={pending} className="px-5 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark disabled:opacity-60">
          {pending ? "Creating…" : "Create survey"}
        </button>
        <button onClick={() => router.back()} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
      </div>
    </div>
  );
}
