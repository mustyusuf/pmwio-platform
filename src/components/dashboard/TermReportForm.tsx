"use client";

import { useActionState } from "react";
import { submitTermReport, type ReportState } from "@/app/actions/reports";

const label = "block text-sm font-medium text-brand-900";
const input = "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function TermReportForm({ applicationId }: { applicationId: string }) {
  const [state, action] = useActionState<ReportState, FormData>(submitTermReport, null);

  if (state?.ok) {
    return <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">Report submitted to the Board and Executive. Thank you.</p>;
  }

  return (
    <form action={action} className="space-y-3">
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{state.error}</p>}
      <input type="hidden" name="applicationId" value={applicationId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label htmlFor="session" className={label}>Session</label><input id="session" name="session" required className={input} placeholder="e.g. 2025/2026" /></div>
        <div><label htmlFor="term" className={label}>Term</label><input id="term" name="term" required className={input} placeholder="e.g. First term" /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label htmlFor="position" className={label}>Position in class</label><input id="position" name="position" type="number" min="1" className={input} placeholder="e.g. 3" /></div>
        <div><label htmlFor="classSize" className={label}>Class size</label><input id="classSize" name="classSize" type="number" min="1" className={input} placeholder="e.g. 34" /></div>
      </div>
      <div><label htmlFor="performance" className={label}>Performance report</label><textarea id="performance" name="performance" required rows={4} className={input} placeholder="Summarise the student's academic performance this term." /></div>
      <div>
        <label htmlFor="result" className={label}>Upload result <span className="text-brand-400">— optional</span></label>
        <input id="result" name="result" type="file" accept="image/*,application/pdf" className="mt-1.5 block w-full text-sm text-brand-900/70 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700" />
        <p className="mt-1 text-xs text-brand-900/50">PDF or image, max 10MB.</p>
      </div>
      <button className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Submit term report</button>
    </form>
  );
}
