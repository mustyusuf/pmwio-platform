"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

type NavLink = { href: string; label: string };

export function MobileNav({
  links,
  isLoggedIn,
}: {
  links: NavLink[];
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle menu"
        aria-expanded={open}
        className="grid h-10 w-10 place-items-center rounded-lg text-brand-900 hover:bg-brand-50"
      >
        {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 z-50 border-b border-brand-100 bg-white px-4 py-4 shadow-lg">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-brand-900 hover:bg-brand-50"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-brand-100 pt-3">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-brand-700 px-3 py-2.5 text-center text-sm font-semibold text-white"
                >
                  My Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-brand-200 px-3 py-2.5 text-center text-sm font-semibold text-brand-700"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="rounded-lg bg-brand-700 px-3 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Become a member
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
