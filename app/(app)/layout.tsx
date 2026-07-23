import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { NotificationBell, type Notification } from "./_notification-bell";
import { UserAvatar } from "@/components/user-avatar";
import { MobileNav } from "./_mobile-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: profile },
    { count: unreadOwn },
    { count: unreadIncoming },
    { data: notifRows },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("full_name, email, avatar_url, is_site_admin")
      .eq("id", user.id)
      .single(),
    // Requester's unread decisions (approved/denied, not yet opened)
    supabase
      .from("speak_requests")
      .select("*", { count: "exact", head: true })
      .eq("requester_user_id", user.id)
      .in("status", ["approved", "denied"])
      .is("requester_read_at", null),
    // Pending incoming requests for orgs the user officers/directs (RLS scopes this)
    supabase
      .from("speak_requests")
      .select("*", { count: "exact", head: true })
      .neq("requester_user_id", user.id)
      .eq("status", "pending"),
    supabase
      .from("notifications")
      .select("id, type, title, body, link, created_at")
      .is("dismissed_at", null)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const displayName = profile?.full_name ?? user.email ?? "You";
  const requestBadge = (unreadOwn ?? 0) + (unreadIncoming ?? 0);
  const notifications = (notifRows ?? []) as Notification[];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-brand text-lg shrink-0">
            AgPodium
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/orgs">Orgs</NavLink>
            <NavLink href="/requests" badge={requestBadge}>Requests</NavLink>
            <NavLink href="/bulletin">Bulletin</NavLink>
            <NavLink href="/calendar">Calendar</NavLink>
            {profile?.is_site_admin && (
              <NavLink href="/bulletin/admin">Admin</NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <NotificationBell initialNotifs={notifications} />
            <Link
              href={`/profile/${user.id}`}
              className="hidden md:flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand"
            >
              <UserAvatar avatarUrl={profile?.avatar_url} name={displayName} size="sm" />
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
            {/* Mobile hamburger */}
            <MobileNav
              links={[
                { href: "/dashboard", label: "Dashboard" },
                { href: "/orgs", label: "Orgs" },
                { href: "/requests", label: "Requests" },
                { href: "/bulletin", label: "Bulletin" },
                { href: "/calendar", label: "Calendar" },
              ]}
              requestBadge={requestBadge}
              isAdmin={profile?.is_site_admin ?? false}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  children,
  badge,
}: {
  href: string;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="relative px-3 py-2 text-gray-700 hover:text-brand rounded"
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </Link>
  );
}
