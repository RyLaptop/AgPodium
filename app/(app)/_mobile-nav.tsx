"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";

export function MobileNav({
  links,
  requestBadge,
  isAdmin,
}: {
  links: { href: string; label: string }[];
  requestBadge: number;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

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
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={close}
                className="relative flex items-center gap-2 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-brand"
              >
                {label}
                {label === "Requests" && requestBadge > 0 && (
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Link>
            ))}
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

          <div className="p-4 border-t border-gray-100">
            <form action={signOut}>
              <button
                type="submit"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-brand transition text-sm"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
