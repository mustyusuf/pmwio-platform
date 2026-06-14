"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/status";
import { PROGRAM_LABEL } from "@/lib/content";
import { formatDate, formatMoney } from "@/lib/format";

export type ColumnType = "text" | "mono" | "status" | "program" | "money" | "date" | "active" | "muted";

export type Column = { key: string; header: string; type?: ColumnType; align?: "left" | "right" };
export type Filter = { key: string; label: string; options: { value: string; label: string }[] };
export type Row = Record<string, string | number | boolean | null | undefined>;

const selectCls =
  "rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-500";

function Cell({ type, value }: { type?: ColumnType; value: Row[string] }) {
  if (value === null || value === undefined || value === "") return <span className="text-brand-900/30">—</span>;
  switch (type) {
    case "status":
      return (
        <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLE[String(value)] ?? "bg-brand-100 text-brand-800"}`}>
          {STATUS_LABEL[String(value)] ?? String(value)}
        </span>
      );
    case "program":
      return <span>{PROGRAM_LABEL[String(value)] ?? String(value)}</span>;
    case "money":
      return <span className="font-medium tabular-nums">{formatMoney(Number(value))}</span>;
    case "date":
      return <span className="text-brand-900/70">{formatDate(String(value))}</span>;
    case "mono":
      return <span className="font-mono text-xs text-brand-900/70">{String(value)}</span>;
    case "active":
      return (
        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${value ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}>
          {value ? "Active" : "Disabled"}
        </span>
      );
    case "muted":
      return <span className="text-brand-900/55">{String(value)}</span>;
    default:
      return <span>{String(value)}</span>;
  }
}

export function DataTable({
  columns,
  rows,
  searchKeys,
  filters = [],
  initialFilters = {},
  searchPlaceholder = "Search…",
  emptyText = "No records found.",
  linkBase,
  pageSize = 10,
}: {
  columns: Column[];
  rows: Row[];
  searchKeys: string[];
  filters?: Filter[];
  initialFilters?: Record<string, string>;
  searchPlaceholder?: string;
  emptyText?: string;
  /** When set, each row gets a trailing "View" link to `${linkBase}/${row.id}`. */
  linkBase?: string;
  pageSize?: number;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Record<string, string>>(initialFilters);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      for (const f of filters) {
        const sel = active[f.key];
        if (sel && String(r[f.key] ?? "") !== sel) return false;
      }
      if (!q) return true;
      return searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q));
    });
  }, [rows, query, active, filters, searchKeys]);

  // Reset to the first page whenever the filter/search changes.
  useEffect(() => { setPage(0); }, [query, active]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return (
    <div className="rounded-3xl border border-brand-100 bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-brand-100 p-4">
        <div className="relative min-w-[200px] flex-1">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-brand-900/40" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" /></svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-brand-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </div>
        {filters.map((f) => (
          <select
            key={f.key}
            value={active[f.key] ?? ""}
            onChange={(e) => setActive((s) => ({ ...s, [f.key]: e.target.value }))}
            className={selectCls}
          >
            <option value="">{f.label}: All</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ))}
        <span className="ml-auto text-xs font-medium text-brand-900/50">{filtered.length} of {rows.length}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-100 text-xs uppercase tracking-wider text-brand-900/50">
              {columns.map((c) => (
                <th key={c.key} className={`whitespace-nowrap px-4 py-3 font-semibold ${c.align === "right" ? "text-right" : ""}`}>{c.header}</th>
              ))}
              {linkBase && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={columns.length + (linkBase ? 1 : 0)} className="px-4 py-10 text-center text-sm text-brand-900/50">{emptyText}</td></tr>
            ) : (
              paged.map((r, i) => (
                <tr key={(r.id as string) ?? i} className="border-b border-brand-50 transition hover:bg-brand-50/50">
                  {columns.map((c) => (
                    <td key={c.key} className={`whitespace-nowrap px-4 py-3 text-brand-900 ${c.align === "right" ? "text-right" : ""}`}>
                      <Cell type={c.type} value={r[c.key]} />
                    </td>
                  ))}
                  {linkBase && (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link href={`${linkBase}/${r.id}`} className="text-sm font-semibold text-brand-700 hover:text-brand-900">View →</Link>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="flex items-center justify-between gap-2 border-t border-brand-100 p-3">
          <span className="text-xs text-brand-900/50">
            Showing {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(safePage - 1)}
              disabled={safePage === 0}
              className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-semibold text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-brand-50"
            >
              Prev
            </button>
            <span className="px-2 text-sm text-brand-900/60">{safePage + 1} / {pageCount}</span>
            <button
              type="button"
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= pageCount - 1}
              className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-semibold text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-brand-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
