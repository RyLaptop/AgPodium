import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { NotificationBell, type Notification } from "./_notification-bell";
import { UserAvatar } from "@/components/user-avatar";
import { MobileNav } from "./_mobile-nav";
import { NavLink } from "./_nav-link";
import { AuthGateProvider } from "./_auth-gate";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile, unreadOwn, unreadIncoming, notifRows] = user
    ? await Promise.all([
        supabase
          .from("users")
          .select("full_name, email, avatar_url, is_site_admin")
          .eq("id", user.id)
          .single()
          .then((r) => r.data),
        supabase
          .from("speak_requests")
          .select("*", { count: "exact", head: true })
          .eq("requester_user_id", user.id)
          .in("status", ["approved", "denied"])
          .is("requester_read_at", null)
          .then((r) => r.count ?? 0),
        supabase
          .from("speak_requests")
          .select("*", { count: "exact", head: true })
          .neq("requester_user_id", user.id)
          .eq("status", "pending")
          .then((r) => r.count ?? 0),
        supabase
          .from("notifications")
          .select("id, type, title, body, link, created_at")
          .is("dismissed_at", null)
          .order("created_at", { ascending: false })
          .limit(30)
          .then((r) => r.data ?? []),
      ])
    : [null, 0, 0, []];

  const displayName = profile?.full_name ?? user?.email ?? "Guest";
  const requestBadge = (unreadOwn as number) + (unreadIncoming as number);
  const notifications = notifRows as Notification[];
  const isAdmin = (profile as { is_site_admin?: boolean } | null)?.is_site_admin ?? false;

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/orgs", label: "Orgs" },
    { href: "/requests", label: "Requests", requiresAuth: true },
    { href: "/messages", label: "Messages", requiresAuth: true },
    { href: "/map", label: "Map" },
    { href: "/bulletin", label: "Bulletin", excludePrefixes: ["/bulletin/admin"] },
    { href: "/calendar", label: "Calendar" },
  ];

  return (
    <AuthGateProvider isAuthed={!!user}>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/dashboard" className="font-bold text-brand text-lg shrink-0">
              AgPodium
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 text-sm">
              {navLinks.map((l) => (
                <NavLink key={l.href} href={l.href} badge={l.href === "/requests" ? requestBadge : undefined} requiresAuth={l.requiresAuth} excludePrefixes={(l as { excludePrefixes?: string[] }).excludePrefixes}>
                  {l.label}
                </NavLink>
              ))}
              {isAdmin && <NavLink href="/bulletin/admin">Admin</NavLink>}
            </nav>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <NotificationBell initialNotifs={notifications} />
                  <Link
                    href={`/profile/${user.id}`}
                    className="hidden md:flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand"
                  >
                    <UserAvatar
                      avatarUrl={(profile as { avatar_url?: string } | null)?.avatar_url}
                      name={displayName}
                      size="sm"
                    />
                    <span className="hidden lg:inline">{displayName}</span>
                  </Link>
                  <form action={signOut} className="hidden md:block">
                    <button
                      type="submit"
                      className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-brand transition"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="text-sm px-3 py-1.5 text-gray-600 hover:text-brand transition"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm px-3 py-1.5 bg-brand text-white rounded-lg hover:bg-brand-dark transition"
                  >
                    Sign up
                  </Link>
                </div>
              )}
              <MobileNav
                links={navLinks}
                requestBadge={requestBadge}
                isAdmin={isAdmin}
                userId={user?.id ?? null}
                displayName={displayName}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-8">
          {children}
        </main>
      </div>
    </AuthGateProvider>
  );
}
