"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  FilePlus2,
  FileText,
  GraduationCap,
  HandHeart,
  House,
  Images,
  ListChecks,
  LogOut,
  Menu,
  Pencil,
  Settings,
  Sprout,
  User,
  UserCog,
  Users,
  WalletCards,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { logoutAction } from "@/app/actions/auth";
import { ROLE_LABEL } from "@/lib/roles";
import type { NavIcon, NavItem } from "@/lib/nav";

const SIDEBAR_ICONS = {
  home: House,
  "file-text": FileText,
  users: Users,
  user: User,
  "user-cog": UserCog,
  image: Images,
  award: GraduationCap,
  "hand-heart": HandHeart,
  sprout: Sprout,
  wallet: WalletCards,
  list: ListChecks,
  settings: Settings,
  "file-plus": FilePlus2,
  pencil: Pencil,
  bell: Bell,
} satisfies Record<NavIcon, typeof House>;

function Icon({ name }: { name: NavIcon }) {
  const SidebarIcon = SIDEBAR_ICONS[name];
  return <SidebarIcon className="h-5 w-5 shrink-0" aria-hidden strokeWidth={1.8} />;
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
    <div className="min-h-screen bg-[#E8E8E8]">
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
            <Menu className="h-6 w-6" aria-hidden />
          </button>
          <div className="hidden text-sm font-semibold text-brand-900 lg:block">{ROLE_LABEL[role] ?? role} dashboard</div>
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden text-sm font-medium text-brand-900/70 hover:text-brand-700 sm:block">View site</Link>
            <form action={logoutAction}>
              <button className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50">
                <LogOut className="h-4 w-4" aria-hidden />
                Log out
              </button>
            </form>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
