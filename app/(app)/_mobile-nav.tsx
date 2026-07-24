"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { useAuthGate } from "./_auth-gate";

export function MobileNav({
  links,
  requestBadge,
  isAdmin,
  userId,
  displayName,
}: {
  links: { href: string; label: string; requiresAuth?: boolean }[];
  requestBadge: number;
  isAdmin: boolean;
  userId: string | null;
  displayName: string;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const { isAuthed, open: openAuthGate } = useAuthGate();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex flex-col gap-1 p-2"
        aria-label="Open menu"
      >
        <span className="w-5 h-0.5 bg-gray-700 block" />
        <span className="w-5 h-0.5 bg-gray-700 block" />
        <span className="w-5 h-0.5 bg-gray-700 block" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col md:hidden">
          <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200">
            <span className="font-bold text-brand text-lg">AgPodium</span>
            <button
              onClick={close}
              className="text-gray-500 text-2xl leading-none"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <nav className="flex-1 flex flex-col p-4 gap-1 text-base overflow-y-auto">
            {links.map(({ href, label, requiresAuth }) => {
              const showDot = label === "Requests" && requestBadge > 0;
              if (requiresAuth && !isAuthed) {
                return (
                  <button
                    key={href}
                    onClick={() => { close(); openAuthGate(); }}
                    className="relative flex items-center gap-2 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-brand text-left"
                  >
                    {label}
                    {showDot && <span className="w-2 h-2 bg-red-500 rounded-full" />}
                  </button>
                );
              }
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  className="relative flex items-center gap-2 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-brand"
                >
                  {label}
                  {showDot && <span className="w-2 h-2 bg-red-500 rounded-full" />}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/bulletin/admin"
                onClick={close}
                className="px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-brand"
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="p-4 border-t border-gray-100 space-y-2">
            {userId ? (
              <>
                <Link
                  href={`/profile/${userId}`}
                  onClick={close}
                  className="block w-full px-4 py-2.5 text-sm text-gray-700 hover:text-brand text-center"
                >
                  {displayName} · View profile
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-brand transition text-sm"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={close}
                  className="block w-full px-4 py-2.5 bg-brand text-white rounded-lg text-sm text-center font-medium hover:bg-brand-dark transition"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={close}
                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-center text-gray-700 hover:bg-gray-50 transition"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
