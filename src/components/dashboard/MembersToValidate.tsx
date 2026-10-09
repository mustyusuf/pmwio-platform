"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, Search } from "lucide-react";
import { approveMembers } from "@/app/actions/workflow";
import { ChangeRoleButton } from "./ChangeRoleButton";
import { MemberApprovalActions } from "./MemberApprovalActions";

export type PendingMember = {
  id: string;
  name: string;
  email: string;
  country: string | null;
  registered: string;
  role: string;
  states: string[];
};

export function MembersToValidate({ members }: { members: PendingMember[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [members, query]);

  // Only count selections that are still in the list (rows disappear once validated).
  const chosen = members.filter((m) => selected.has(m.id));
  const allVisibleSelected = visible.length > 0 && visible.every((m) => selected.has(m.id));

  useEffect(() => {
    if (!confirming) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setConfirming(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [confirming]);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visible.forEach((m) => next.delete(m.id));
      else visible.forEach((m) => next.add(m.id));
      return next;
    });
  }

  function validateSelected() {
    const ids = chosen.map((m) => m.id);
    setNotice(null);
    startTransition(async () => {
      const result = await approveMembers(ids);
      setConfirming(false);
      if (result.ok) {
        setSelected(new Set());
        setNotice({
          ok: true,
          text: `Validated ${result.approved} member${result.approved === 1 ? "" : "s"}${result.skipped ? ` (${result.skipped} had already been handled)` : ""}. Their activation emails are on the way.`,
        });
      } else {
        setNotice({ ok: false, text: result.error });
      }
    });
  }

  return (
    <div>
      {notice && (
        <p className={`mb-3 rounded-lg px-3 py-2 text-sm font-medium ${notice.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{notice.text}</p>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-brand-200 px-3 py-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200 sm:max-w-sm">
          <Search className="h-4 w-4 shrink-0 text-brand-900/40" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search waiting members…"
            aria-label="Search waiting members"
            className="w-full min-w-0 bg-transparent text-sm outline-none"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-brand-900">
          <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} className="h-4 w-4 accent-brand-700" />
          {query.trim() ? `Select all ${visible.length} shown` : `Select all ${members.length}`}
        </label>
      </div>

      {chosen.length > 0 && (
        <div className="sticky top-16 z-10 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-emerald-900">{chosen.length} selected</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setSelected(new Set())} className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100">
              Clear
            </button>
            <button type="button" onClick={() => setConfirming(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">
              <Check className="h-4 w-4" aria-hidden /> Validate {chosen.length} selected
            </button>
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-brand-900/55">No waiting members match &quot;{query}&quot;.</p>
      ) : (
        <ul className="divide-y divide-brand-100">
          {visible.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} className="h-4 w-4 shrink-0 accent-brand-700" aria-label={`Select ${m.name}`} />
                <div className="min-w-0">
                  <p className="font-medium text-brand-900">{m.name}</p>
                  <p className="break-all text-xs text-brand-900/50">{m.email}{m.country ? ` · ${m.country}` : ""} · registered {m.registered}</p>
                </div>
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <ChangeRoleButton userId={m.id} name={m.name} currentRole={m.role} currentStates={m.states} />
                <MemberApprovalActions userId={m.id} name={m.name} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => e.currentTarget === e.target && !pending && setConfirming(false)}
        >
          <div role="alertdialog" aria-modal="true" aria-labelledby="bulk-title" className="w-full max-w-md rounded-2xl border border-brand-100 bg-white p-6 shadow-2xl">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="h-5 w-5" aria-hidden />
            </div>
            <h2 id="bulk-title" className="mt-4 text-lg font-bold text-brand-950">
              Validate {chosen.length} member{chosen.length === 1 ? "" : "s"}?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-900/65">
              Each will be marked as a validated member and sent an activation email with their User ID. They already have access to their dashboards.
            </p>
            {chosen.length > 150 && (
              <p className="mt-2 text-xs text-brand-900/55">Shared mail hosts often cap sending at a few hundred emails an hour, so some activation emails in a very large batch may be delayed or fail.</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={pending} onClick={() => setConfirming(false)} className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                Cancel
              </button>
              <button type="button" disabled={pending} onClick={validateSelected} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                <Check className="h-4 w-4" aria-hidden /> {pending ? "Validating…" : `Yes, validate ${chosen.length}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
