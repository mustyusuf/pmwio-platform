import { STATUS_LABEL, STATUS_STYLE } from "@/lib/status";

/** A single KPI tile. */
export function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-[0_14px_30px_rgba(18,39,25,0.18)] ${
        accent ? "border-brand-200 bg-brand-50" : "border-brand-100 bg-white"
      }`}
    >
      <div className="text-2xl font-extrabold text-brand-800 sm:text-3xl">{value}</div>
      <div className="mt-1 text-xs font-medium text-brand-900/60">{label}</div>
      {hint && <div className="mt-1 text-[11px] text-brand-900/40">{hint}</div>}
    </div>
  );
}

/** A titled content panel. */
export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl border border-brand-100 bg-white p-6 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-lg font-bold text-brand-950">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        STATUS_STYLE[status] ?? "bg-brand-100 text-brand-800"
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 p-6 text-center text-sm text-brand-900/60">
      {children}
    </div>
  );
}

export function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(d),
  );
}

export function formatMoney(n: number) {
  return "₦" + Math.round(n).toLocaleString("en-NG");
}
