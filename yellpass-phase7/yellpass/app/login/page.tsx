"use client";

import { useActionState } from "react";
import { signInWithEmail, type SignInResult } from "@/app/auth/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<
    SignInResult | null,
    FormData
  >(signInWithEmail, null);

  if (state?.ok) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-semibold">Check your email</h1>
          <p className="text-gray-600">
            We sent a sign-in link to{" "}
            <span className="font-medium text-gray-900">{state.email}</span>.
            Open it on this device to finish signing in.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-brand">YellPass</h1>
          <p className="text-gray-600 text-sm">
            Sign in with your @tamu.edu email
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <label className="block">
            <span className="sr-only">Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="[email protected]"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="w-full px-4 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-60 transition"
          >
            {pending ? "Sending link…" : "Send magic link"}
          </button>

          {state && !state.ok && (
            <p className="text-sm text-red-600 text-center">{state.error}</p>
          )}
        </form>

        <p className="text-xs text-gray-500 text-center">
          By signing in you agree that YellPass is a pilot project.
        </p>
      </div>
    </main>
  );
}
