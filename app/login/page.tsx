"use client";

import { useActionState, useState } from "react";
import {
  signInWithPassword,
  signUpWithPassword,
  type SignInResult,
} from "@/app/auth/actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const [signinState, signinAction, signinPending] = useActionState<
    SignInResult | null,
    FormData
  >(signInWithPassword, null);

  const [signupState, signupAction, signupPending] = useActionState<
    SignInResult | null,
    FormData
  >(signUpWithPassword, null);

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-brand">AgPodium</h1>
          <p className="text-gray-500 text-sm">
            {mode === "signin" ? "Sign in to your account" : "Create an account"}
          </p>
        </div>

        {mode === "signin" ? (
          <form action={signinAction} className="space-y-4">
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="[email protected]"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <button
              type="submit"
              disabled={signinPending}
              className="w-full px-4 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60 transition"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="[email protected]"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <input
              type="password"
              name="password"
              required
              autoComplete="new-password"
              placeholder="Choose a password (8+ characters)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <button
              type="submit"
              disabled={signupPending}
              className="w-full px-4 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60 transition"
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
              <button
                onClick={() => setMode("signup")}
                className="text-brand hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setMode("signin")}
                className="text-brand hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
