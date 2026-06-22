import Link from "next/link";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { getSession } from "@/lib/session";

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/programs", label: "What We Do" },
  { href: "/gallery", label: "Gallery" },
  { href: "/donate", label: "Donate" },
  { href: "/contact", label: "Contact" },
  { href: "/apply", label: "Apply" },
];

export async function SiteHeader() {
  const session = await getSession();
  const isLoggedIn = Boolean(session);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-brand-900/80 transition hover:text-brand-700"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
            >
              My Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-brand-700 transition hover:text-brand-900"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
              >
                Become a member
              </Link>
            </>
          )}
        </div>

        <MobileNav links={NAV_LINKS} isLoggedIn={isLoggedIn} />
      </div>
    </header>
  );
}
