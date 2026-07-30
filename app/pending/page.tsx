import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

export default async function PendingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("is_verified, is_site_admin").eq("id", user.id).single();

  if (profile?.is_verified || profile?.is_site_admin) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6 text-center">
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

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-6 py-10 space-y-4">
          <p className="text-4xl">⏳</p>
          <h1 className="text-xl font-semibold text-gray-900">Account pending approval</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Your account is waiting for an admin to approve it. You&apos;ll receive access once approved — check back soon.
          </p>
          <p className="text-xs text-gray-400">
            Signed in as <span className="font-medium text-gray-600">{user.email}</span>
          </p>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
