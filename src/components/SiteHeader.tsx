import Link from "next/link";
import { Logo } from "./Logo";
import { LiveClock } from "./LiveClock";
import { MobileNav } from "./MobileNav";
import { NavLink } from "./NavLink";
import { SocialIconLinks } from "./SocialLinks";
import { getSession } from "@/lib/session";
import { loadSiteContent } from "@/lib/content-store";
import { socialLinks } from "@/lib/social";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/programs", label: "What We Do" },
  { href: "/orphanage", label: "Orphanage" },
  { href: "/gallery", label: "Gallery" },
  { href: "/archive", label: "Archive" },
  { href: "/donate", label: "Donate" },
  { href: "/contact", label: "Contact" },
  { href: "/apply", label: "Apply" },
];

export async function SiteHeader() {
  const [session, sc] = await Promise.all([getSession(), loadSiteContent()]);
  const isLoggedIn = Boolean(session);
  const socials = socialLinks(sc);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/90 backdrop-blur">
      <div className="bg-brand-950">
        <div className="mx-auto flex max-w-6xl items-center justify-end px-4 py-1.5 text-xs font-medium text-brand-100 sm:px-6">
          <LiveClock />
        </div>
      </div>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden flex-nowrap items-center gap-5 md:flex">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} />
          ))}
        </nav>

        <div className="hidden flex-nowrap items-center gap-3 md:flex">
          {/* Hidden below lg so the nav links and CTAs don't wrap on tablets. */}
          <SocialIconLinks links={socials} className="hidden lg:flex" />
          {socials.length > 0 && <span className="hidden h-5 w-px bg-brand-100 lg:block" aria-hidden />}
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="whitespace-nowrap rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
            >
              My Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="whitespace-nowrap text-sm font-semibold text-brand-700 transition hover:text-brand-900"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="whitespace-nowrap rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
              >
                Become a member
              </Link>
            </>
          )}
        </div>

        <MobileNav links={NAV_LINKS} isLoggedIn={isLoggedIn} socials={socials} />
      </div>
    </header>
  );
}
