"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** A top-nav link that bolds itself and gets an underline while its page is active. */
export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`whitespace-nowrap border-b-2 pb-1 text-sm transition ${
        isActive
          ? "border-brand-700 font-semibold text-brand-900"
          : "border-transparent font-medium text-brand-900/80 hover:text-brand-700"
      }`}
    >
      {label}
    </Link>
  );
}
