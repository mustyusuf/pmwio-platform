import Link from "next/link";

/** The organization wordmark with a heart emblem. */
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-800 shadow-sm"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
          <path d="M12 21s-7.5-4.6-10-9.2C.6 9 1.7 5.5 5 5c2-.3 3.5.9 4.4 2.2C10.3 5.9 11.8 4.7 13.8 5c3.3.5 4.4 4 2.2 6.8C19.5 16.4 12 21 12 21z" />
        </svg>
      </span>
      <span className="leading-tight">
        <span
          className={`block text-sm font-bold tracking-tight ${
            light ? "text-white" : "text-brand-900"
          }`}
        >
          Pious Muslim Women
        </span>
        <span
          className={`block text-[11px] font-medium uppercase tracking-wider ${
            light ? "text-brand-100" : "text-brand-500"
          }`}
        >
          International Organization
        </span>
      </span>
    </Link>
  );
}
