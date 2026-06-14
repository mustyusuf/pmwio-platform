"use client";

import { useEffect, useMemo, useState } from "react";
import { setUserActive } from "@/app/actions/workflow";
import { ROLE_LABEL } from "@/lib/roles";
import { formatDate } from "@/lib/format";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  userId: string;
  role: string;
  active: boolean;
  createdAt: string;
};

export function UsersManagementTable({ rows, selfId }: { rows: UserRow[]; selfId: string }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (role && r.role !== role) return false;
      if (!q) return true;
      return [r.name, r.email, r.userId].some((v) => v.toLowerCase().includes(q));
    });
  }, [rows, query, role]);

  useEffect(() => { setPage(0); }, [query, role]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const roles = [...new Set(rows.map((r) => r.role))];

  return (
    <div className="rounded-3xl border border-brand-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-brand-100 p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users…"
          className="min-w-[200px] flex-1 rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500">
          <option value="">Role: All</option>
          {roles.map((r) => (<option key={r} value={r}>{ROLE_LABEL[r] ?? r}</option>))}
        </select>
        <span className="ml-auto text-xs font-medium text-brand-900/50">{filtered.length} of {rows.length}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-100 text-xs uppercase tracking-wider text-brand-900/50">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">User ID</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {paged.map((u) => (
              <tr key={u.id} className="border-b border-brand-50 hover:bg-brand-50/50">
                <td className="px-4 py-3">
                  <div className="font-medium text-brand-900">{u.name}</div>
                  <div className="text-xs text-brand-900/40">{u.email}</div>
                </td>
                <td className="px-4 py-3 text-brand-900/70">{ROLE_LABEL[u.role] ?? u.role}</td>
                <td className="px-4 py-3 font-mono text-xs text-brand-900/60">{u.userId}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${u.active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}>
                    {u.active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3 text-brand-900/60">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  {u.id !== selfId && (
                    <form action={setUserActive}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="active" value={(!u.active).toString()} />
                      <button className="text-xs font-semibold text-brand-700 hover:text-brand-900">{u.active ? "Disable" : "Enable"}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > pageSize && (
        <div className="flex items-center justify-between gap-2 border-t border-brand-100 p-3">
          <span className="text-xs text-brand-900/50">
            Showing {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPage(safePage - 1)} disabled={safePage === 0} className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-semibold text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-brand-50">Prev</button>
            <span className="px-2 text-sm text-brand-900/60">{safePage + 1} / {pageCount}</span>
            <button type="button" onClick={() => setPage(safePage + 1)} disabled={safePage >= pageCount - 1} className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-semibold text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-brand-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
