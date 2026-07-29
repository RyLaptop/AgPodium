"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UniSelector() {
  const [uni, setUni] = useState<"tamu" | "lsu" | "">("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uni) return;
    setLoading(true);
    document.cookie = `uni=${uni}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    router.push("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select your university
        </label>
        <select
          value={uni}
          onChange={(e) => setUni(e.target.value as "tamu" | "lsu" | "")}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
          required
        >
          <option value="" disabled>Choose a university…</option>
          <option value="tamu">Texas A&M University</option>
          <option value="lsu">Louisiana State University</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={!uni || loading}
        className="w-full py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:opacity-40 transition"
      >
        {loading ? "Loading…" : "Continue →"}
      </button>
    </form>
  );
}
