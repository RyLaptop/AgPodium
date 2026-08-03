"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthGate } from "./_auth-gate";

export function NavLink({
  href,
  children,
  badge,
  requiresAuth,
  excludePrefixes,
}: {
  href: string;
  children: React.ReactNode;
  badge?: number;
  requiresAuth?: boolean;
  excludePrefixes?: string[];
}) {
  const pathname = usePathname();
  const { isAuthed, open } = useAuthGate();

  const isExcluded = (excludePrefixes ?? []).some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const active =
    !isExcluded &&
    (href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(href + "/"));

  const cls = `relative px-2.5 py-1.5 rounded transition text-sm ${
    active ? "text-brand font-semibold bg-brand/5" : "text-gray-700 hover:text-brand"
  }`;

  const dot = badge != null && badge > 0
    ? <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
    : null;

  if (requiresAuth && !isAuthed) {
    return (
      <button onClick={open} className={cls}>
        {children}
        {dot}
      </button>
    );
  }

  return (
    <Link href={href} className={cls}>
      {children}
      {dot}
    </Link>
  );
}
