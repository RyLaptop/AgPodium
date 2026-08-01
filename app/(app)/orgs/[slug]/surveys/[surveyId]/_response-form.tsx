"use client";

import { useState, useTransition } from "react";
import { submitSurveyResponse } from "../actions";

type Question = { id: string; question_text: string; question_type: string; options: string[] | null };

export function ResponseForm({ surveyId, orgSlug, questions }: { surveyId: string; orgSlug: string; questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const setAnswer = (id: string, val: string | string[]) => setAnswers((a) => ({ ...a, [id]: val }));

  const toggleCheckbox = (id: string, opt: string) => {
    const current = (answers[id] as string[] | undefined) ?? [];
    setAnswer(id, current.includes(opt) ? current.filter((x) => x !== opt) : [...current, opt]);
  };

  const submit = () => {
    startTransition(async () => {
      setError(null);
      const res = await submitSurveyResponse(surveyId, orgSlug, answers);
      if (!res.ok) { setError(res.error); return; }
      setSubmitted(true);
    });
  };

  if (submitted) return (
    <div className="border border-green-200 bg-green-50 rounded-xl p-6 text-center">
      <p className="text-green-700 font-semibold">Response submitted!</p>
      <p className="text-sm text-green-600 mt-1">Thank you for filling out this survey.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {questions.map((q) => (
        <div key={q.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="font-medium text-sm">{q.question_text}</p>
          {q.question_type === "text" && (
            <textarea
              rows={3}
              value={(answers[q.id] as string) ?? ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              placeholder="Your answer…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand"
            />
          )}
          {q.question_type === "multiple_choice" && (q.options ?? []).map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name={q.id}
                value={opt}
                checked={(answers[q.id] as string) === opt}
                onChange={() => setAnswer(q.id, opt)}
                className="text-brand focus:ring-brand"
              />
              {opt}
            </label>
          ))}
          {q.question_type === "checkbox" && (q.options ?? []).map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={((answers[q.id] as string[]) ?? []).includes(opt)}
                onChange={() => toggleCheckbox(q.id, opt)}
                className="rounded border-gray-300 text-brand focus:ring-brand"
              />
              {opt}
            </label>
          ))}
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button onClick={submit} disabled={pending} className="px-5 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark disabled:opacity-60">
        {pending ? "Submitting…" : "Submit response"}
      </button>
    </div>
  );
}
