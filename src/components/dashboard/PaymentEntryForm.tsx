"use client";

import { useActionState } from "react";
import { createPayment, type PaymentEntryState } from "@/app/actions/workflow";

const input = "w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function PaymentEntryForm({ applicationId }: { applicationId: string }) {
  const [state, action] = useActionState<PaymentEntryState, FormData>(createPayment, null);

  if (state?.ok) {
    return <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">Payment entered and sent for board approval.</p>;
  }

  return (
    <form action={action} className="mt-3 space-y-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{state.error}</p>}
      <div className="grid gap-2 sm:grid-cols-3">
        <input name="amount" type="number" min="1" step="any" required placeholder="Amount (₦)" className={input} />
        <input name="method" placeholder="Method (e.g. Bank transfer)" className={input} />
        <input name="reference" placeholder="Bank reference / note" className={input} />
      </div>
      <button className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Enter payment</button>
    </form>
  );
}
