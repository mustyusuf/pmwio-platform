"use client";

import { useActionState, useState } from "react";
import { createFormField, type FormFieldState } from "@/app/actions/formFields";
import { CUSTOM_FIELD_TYPES } from "@/lib/content";

const label = "block text-sm font-medium text-brand-900";
const input = "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function FormFieldBuilder() {
  const [state, action] = useActionState<FormFieldState, FormData>(createFormField, null);
  const [type, setType] = useState("text");

  return (
    <form action={action} className="space-y-3">
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{state.error}</p>}
      {state?.ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">Field “{state.created}” added.</p>}

      <div><label htmlFor="label" className={label}>Field label</label><input id="label" name="label" required className={input} placeholder="e.g. Date of birth" /></div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className={label}>Applies to</label>
          <select id="category" name="category" required defaultValue="" className={input}>
            <option value="" disabled>Select program…</option>
            <option value="SCHOLARSHIP">Scholarship</option>
            <option value="ORPHANAGE">Orphanage</option>
            <option value="EMPOWERMENT">Empowerment</option>
            <option value="ALL">All programs</option>
          </select>
        </div>
        <div>
          <label htmlFor="type" className={label}>Field type</label>
          <select id="type" name="type" required value={type} onChange={(e) => setType(e.target.value)} className={input}>
            {CUSTOM_FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {type === "select" && (
        <div><label htmlFor="options" className={label}>Options <span className="text-brand-400">(comma-separated)</span></label><input id="options" name="options" className={input} placeholder="e.g. Option A, Option B, Option C" /></div>
      )}

      <label className="flex items-center gap-2 text-sm text-brand-900/80"><input type="checkbox" name="required" className="h-4 w-4 rounded border-brand-300" /> Required field</label>

      <button className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Add field</button>
    </form>
  );
}
