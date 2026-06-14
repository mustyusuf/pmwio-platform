"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { logoutAction } from "@/app/actions/auth";
import { ROLE_LABEL } from "@/lib/roles";
import type { NavItem } from "@/lib/nav";

function Icon({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    home: <path {...common} d="M3 10.5 12 4l9 6.5M5 9.5V20h14V9.5" />,
    doc: <path {...common} d="M7 3h7l4 4v14H7zM14 3v4h4" />,
    users: <path {...common} d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20a5 5 0 0 1 10 0M16 11a3 3 0 1 0 0-6M21 20a5 5 0 0 0-5-5" />,
    user: <path {...common} d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" />,
    image: <path {...common} d="M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M9 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />,
    award: <path {...common} d="M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM8.5 13.5 7 21l5-3 5 3-1.5-7.5" />,
    heart: <path {...common} d="M12 20s-7-4.3-9.2-8.5C1.4 8.5 2.7 5.4 6 5c2-.2 3.5 1 4 2.3C10.5 6 12 4.8 14 5c3.3.4 4.6 3.5 3.2 6.5C19 15.7 12 20 12 20Z" />,
    cash: <path {...common} d="M3 7h18v10H3zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 9v6M18 9v6" />,
    list: <path {...common} d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
    cog: <path {...common} d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />,
    bell: <path {...common} d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 21a2 2 0 0 0 4 0" />,
  };
  return <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">{paths[name] ?? paths.doc}</svg>;
}

export function DashboardChrome({
  name,
  code,
  role,
  navItems,
  children,
}: {
  name: string;
  code: string;
  role: string;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const program = searchParams.get("program");
  const [open, setOpen] = useState(false);

  const topActive = (item: NavItem) => {
    if (item.href === "/dashboard") return pathname === "/dashboard";
    return pathname === item.href || pathname.startsWith(item.href + "/") ||
      (item.children ? pathname.startsWith(item.href) : false);
  };
  const childActive = (href: string) => {
    const [path, query] = href.split("?");
    const prog = query?.match(/program=(\w+)/)?.[1] ?? null;
    return pathname === path && program === prog;
  };

  const nav = (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active = topActive(item);
        if (item.disabled) {
          return (
            <div
              key={item.href}
              title="This section is currently closed"
              className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/30"
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.badge && <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px]">{item.badge}</span>}
            </div>
          );
        }
        return (
          <div key={item.href}>
            <Link
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-brand-700 text-white shadow-sm" : "text-brand-100/90 hover:bg-white/10"
              }`}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.badge && <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] ${active ? "bg-white/20" : "bg-emerald-500/30 text-emerald-50"}`}>{item.badge}</span>}
            </Link>
            {item.children && active && (
              <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-white/15 pl-3">
                {item.children.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    onClick={() => setOpen(false)}
                    className={`rounded-lg px-3 py-1.5 text-sm transition ${
                      childActive(c.href) ? "bg-white/15 text-white" : "text-brand-100/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-brand-50/50">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-brand-950 px-4 py-5 lg:flex">
        <div className="px-2 [&_*]:!text-white">
          <Logo light />
        </div>
        <div className="mt-8 flex-1 overflow-y-auto">{nav}</div>
        <div className="mt-4 rounded-xl bg-white/5 p-3">
          <p className="truncate text-sm font-semibold text-white">{name}</p>
          <p className="text-[11px] text-brand-200">{ROLE_LABEL[role] ?? role} · {code}</p>
        </div>
      </aside>

      {/* Sidebar — mobile drawer */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-950 px-4 py-5 lg:hidden">
            <div className="px-2"><Logo light /></div>
            <div className="mt-8 flex-1 overflow-y-auto">{nav}</div>
          </aside>
        </>
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-brand-100 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-lg text-brand-900 hover:bg-brand-50 lg:hidden"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <div className="hidden text-sm font-semibold text-brand-900 lg:block">{ROLE_LABEL[role] ?? role} dashboard</div>
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden text-sm font-medium text-brand-900/70 hover:text-brand-700 sm:block">View site</Link>
            <form action={logoutAction}>
              <button className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50">Log out</button>
            </form>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
