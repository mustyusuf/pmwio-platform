"use client";

import { useActionState } from "react";
import { CircleCheckBig } from "lucide-react";
import { submitEmpowerment, type EmpowermentState } from "@/app/actions/empowerment";
import { RichTextEditor } from "@/components/forms/RichTextEditor";
import type { CustomField } from "@/components/forms/ApplyForm";

const label = "block text-sm font-medium text-brand-900";
const input = "mt-1.5 w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function EmpowermentForm({
  prefill,
  customFields = [],
}: {
  prefill: { name: string; email: string; userId: string; phone: string | null };
  customFields?: CustomField[];
}) {
  const [state, action] = useActionState<EmpowermentState, FormData>(submitEmpowerment, null);

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CircleCheckBig className="mx-auto h-8 w-8 text-emerald-700" aria-hidden />
        <h3 className="mt-2 text-lg font-bold text-emerald-900">Application submitted</h3>
        <p className="mt-1 text-sm text-emerald-800">Reference <span className="font-mono font-bold">{state.reference}</span>. It is now with the Board for review.</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state?.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{state.error}</p>}

      {/* Prefilled, read-only member details */}
      <div className="rounded-xl bg-brand-50 p-4 ring-1 ring-brand-100">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Your details (from your account)</p>
        <div className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <div><span className="text-brand-900/50">Name:</span> <span className="font-medium">{prefill.name}</span></div>
          <div><span className="text-brand-900/50">User ID:</span> <span className="font-mono">{prefill.userId}</span></div>
          <div><span className="text-brand-900/50">Email:</span> <span className="font-medium">{prefill.email}</span></div>
          <div><span className="text-brand-900/50">Phone:</span> <span className="font-medium">{prefill.phone || "—"}</span></div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="purpose" className={label}>Purpose of application</label><input id="purpose" name="purpose" required className={input} placeholder="e.g. Start a tailoring business" /></div>
        <div><label htmlFor="desiredAmount" className={label}>Desired amount (₦)</label><input id="desiredAmount" name="desiredAmount" type="number" min="1" step="any" required className={input} placeholder="e.g. 150000" /></div>
      </div>

      <div><span className={label}>Cover letter</span><RichTextEditor name="coverLetter" placeholder="Introduce yourself and your request." minHeight={140} /></div>
      <div><span className={label}>Why you need the empowerment</span><RichTextEditor name="whyNeeded" placeholder="Explain your current situation and need." /></div>
      <div><span className={label}>Sustainability plan</span><RichTextEditor name="sustainabilityPlan" placeholder="How will you sustain and grow this?" /></div>

      {customFields.length > 0 && (
        <div className="grid gap-4 rounded-xl border border-brand-100 p-4 sm:grid-cols-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 sm:col-span-2">Additional information</p>
          {customFields.map((f) => (
            <div key={f.id} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
              <label htmlFor={`cf-${f.name}`} className={label}>{f.label}{f.required ? "" : " (optional)"}</label>
              {f.type === "textarea" ? (
                <textarea id={`cf-${f.name}`} name={f.name} required={f.required} rows={3} className={input} />
              ) : f.type === "select" ? (
                <select id={`cf-${f.name}`} name={f.name} required={f.required} className={input}>
                  <option value="">Select…</option>
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input id={`cf-${f.name}`} name={f.name} type={f.type === "number" ? "number" : "text"} required={f.required} className={input} />
              )}
            </div>
          ))}
        </div>
      )}

      <div>
        <label htmlFor="document" className={label}>Supporting document <span className="text-brand-400">— optional</span></label>
        <input id="document" name="document" type="file" accept="image/*,application/pdf" className="mt-1.5 block w-full text-sm text-brand-900/70 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700" />
        <p className="mt-1 text-xs text-brand-900/50">Business plan, quotation, etc. PDF or image, max 10MB.</p>
      </div>

      <div>
        <label htmlFor="refereeId" className={label}>Referee (another member) <span className="text-brand-400">— optional</span></label>
        <input id="refereeId" name="refereeId" className={`${input} uppercase`} placeholder="PMW-XXXXXX" />
        <p className="mt-1 text-xs text-brand-900/50">Optionally name another member who can endorse your application.</p>
      </div>

      <button className="w-full rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800">Submit empowerment application</button>
    </form>
  );
}
