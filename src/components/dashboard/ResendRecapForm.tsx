"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { resendMonthlyRecap, type ResendRecapState } from "@/app/actions/leaderboard";
import { DateInput } from "./DateInput";

const label = "block text-sm font-medium text-brand-900";
const input =
  "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

/** "YYYY-MM" for last calendar month — the usual thing an admin wants to resend. */
function defaultMonth() {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}`;
}

export function ResendRecapForm() {
  const [state, action, isPending] = useActionState<ResendRecapState, FormData>(resendMonthlyRecap, null);

  return (
    <form action={action} className="space-y-4">
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p>}
      {state?.ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          Sent the {state.label} recap to {state.count} member{state.count === 1 ? "" : "s"} (broadcast + individual congratulations).
        </p>
      )}
      <div>
        <label className={label} htmlFor="month">Month</label>
        <DateInput id="month" name="month" type="month" required defaultValue={defaultMonth()} className={input} />
      </div>
      <button
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
      >
        <Mail className="h-4 w-4" aria-hidden />
        {isPending ? "Sending…" : "Resend monthly recap"}
      </button>
      <p className="text-xs text-brand-900/50">
        Sends the top-10 broadcast and each winner&apos;s congratulations email for the chosen month — even if it was already auto-sent or silently skipped (e.g. SMTP wasn&apos;t configured at the time).
      </p>
    </form>
  );
}
