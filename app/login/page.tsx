"use client";

import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  signInWithPassword,
  signUpWithPassword,
  type SignInResult,
} from "@/app/auth/actions";
import { UNIVERSITIES, type University } from "@/lib/university-data";

const UNI_OPTIONS = (Object.entries(UNIVERSITIES) as [University, typeof UNIVERSITIES[University]][])
  .sort((a, b) => a[1].name.localeCompare(b[1].name));

function Logo() {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <svg width="36" height="36" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style={{ color: "#3B82F6" }}>
        <circle cx="40" cy="10" r="4.5" fill="currentColor"/>
        <line x1="40" y1="14.5" x2="40" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M14 22 L66 22 L60 36 L20 36 Z" fill="#0F172A"/>
        <line x1="26" y1="30" x2="54" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M30 36 L50 36 L47 62 L33 62 Z" fill="#0F172A"/>
        <path d="M22 62 L58 62 L60 70 L20 70 Z" fill="#0F172A"/>
      </svg>
      <span className="font-bold text-3xl" style={{ letterSpacing: "-0.025em" }}>
        <span className="text-slate-900">Uni</span><span className="text-blue-600">Podium</span>
      </span>
    </div>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );

  const [signinState, signinAction, signinPending] = useActionState<
    SignInResult | null,
    FormData
  >(signInWithPassword, null);

  const [signupState, signupAction, signupPending] = useActionState<
    SignInResult | null,
    FormData
  >(signUpWithPassword, null);

  const urlError = searchParams.get("error");

  return (
    <div className="max-w-md w-full space-y-6">
      <div className="text-center space-y-3">
        <Logo />
        <p className="text-gray-500 text-sm">
          {mode === "signin" ? "Sign in to your account" : "Create your account"}
        </p>
      </div>

      {urlError && (
        <p className="text-sm text-red-600 text-center bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {decodeURIComponent(urlError).replace(/_/g, " ")}
        </p>
      )}

      {mode === "signin" ? (
        <form action={signinAction} className="space-y-4">
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="[email protected]"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={signinPending}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
          >
            {signinPending ? "Signing in…" : "Sign in"}
          </button>
          {signinState && !signinState.ok && (
            <p className="text-sm text-red-600 text-center">{signinState.error}</p>
          )}
        </form>
      ) : (
        <form action={signupAction} className="space-y-4">
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            placeholder="Display name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="[email protected]"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            name="password"
            required
            autoComplete="new-password"
            placeholder="Password (8+ characters)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            name="confirm_password"
            required
            autoComplete="new-password"
            placeholder="Confirm password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            name="university"
            required
            defaultValue=""
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          >
            <option value="" disabled>Select your university</option>
            {UNI_OPTIONS.map(([key, uni]) => (
              <option key={key} value={key}>{uni.name}</option>
            ))}
          </select>
          <p className="text-xs text-center text-gray-400">
            Don&apos;t see your university?{" "}
            <a href="/ambassador" className="text-blue-600 hover:underline">
              Apply to be a campus ambassador
            </a>
          </p>
          <button
            type="submit"
            disabled={signupPending}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
          >
            {signupPending ? "Creating account…" : "Create account"}
          </button>
          {signupState && !signupState.ok && (
            <p className="text-sm text-red-600 text-center">{signupState.error}</p>
          )}
        </form>
      )}

      <p className="text-sm text-center text-gray-500">
        {mode === "signin" ? (
          <>
            No account?{" "}
            <button onClick={() => setMode("signup")} className="text-blue-600 hover:underline">
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button onClick={() => setMode("signin")} className="text-blue-600 hover:underline">
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
