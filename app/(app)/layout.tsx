import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards this, but belt-and-suspenders:
  if (!user) redirect("/login");

  // Get profile info from public.users (created by trigger on signup)
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email, avatar_url, is_site_admin")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name ?? user.email ?? "You";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-brand text-lg">
            YellPass
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/orgs">Orgs</NavLink>
            <NavLink href="/requests">Requests</NavLink>
            <NavLink href="/bulletin">Bulletin</NavLink>
            {profile?.is_site_admin && (
              <NavLink href="/bulletin/admin">Admin</NavLink>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {displayName}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-gray-600 hover:text-brand"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  children,
  disabled,
}: {
  href: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="px-3 py-2 text-gray-400 cursor-not-allowed" title="Coming soon">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="px-3 py-2 text-gray-700 hover:text-brand rounded"
    >
      {children}
    </Link>
  );
}
