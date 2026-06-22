"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { createFormField, type FormFieldState } from "@/app/actions/formFields";
import { CUSTOM_FIELD_TYPES } from "@/lib/content";

const label = "block text-sm font-medium text-brand-900";
const input = "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function FormFieldBuilder() {
  const [state, action] = useActionState<FormFieldState, FormData>(createFormField, null);
  const [type, setType] = useState("text");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Add a field
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-field-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-brand-100 bg-white shadow-2xl"
          >
            <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-brand-100 bg-white px-5 py-4">
              <div>
                <h2 id="add-field-title" className="text-lg font-bold text-brand-950">Add a field</h2>
                <p className="mt-0.5 text-sm text-brand-900/55">Create a custom field for one or more application forms.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-brand-900/60 transition hover:bg-brand-50 hover:text-brand-900"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <form action={action} className="space-y-4 p-5">
              {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p>}
              {state?.ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">Field “{state.created}” added.</p>}

              <div>
                <label htmlFor="label" className={label}>Field label</label>
                <input id="label" name="label" required autoFocus className={input} placeholder="e.g. Date of birth" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                    {CUSTOM_FIELD_TYPES.map((fieldType) => <option key={fieldType} value={fieldType}>{fieldType}</option>)}
                  </select>
                </div>
              </div>

              {type === "select" && (
                <div>
                  <label htmlFor="options" className={label}>Options <span className="text-brand-400">(comma-separated)</span></label>
                  <input id="options" name="options" className={input} placeholder="e.g. Option A, Option B, Option C" />
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-brand-900/80">
                <input type="checkbox" name="required" className="h-4 w-4 rounded border-brand-300" />
                Required field
              </label>

              <div className="flex justify-end gap-3 border-t border-brand-100 pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                >
                  Cancel
                </button>
                <button className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
                  <Plus className="h-4 w-4" aria-hidden />
                  Add field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
