"use client";

import { useActionState } from "react";
import { Eye, Trash2 } from "lucide-react";
import { manageTestPayments, type TestPaymentsState } from "@/app/actions/test-payments";
import { formatMoney } from "@/lib/format";

const label = "block text-sm font-medium text-brand-900";
const input =
  "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function TestPaymentsCleanup() {
  const [state, action, isPending] = useActionState<TestPaymentsState, FormData>(manageTestPayments, null);
  const preview = state && "preview" in state ? (state.preview ?? null) : null;
  const nothingToDelete = preview && preview.donations + preview.subscriptions + preview.plans === 0;

  return (
    <form action={action} className="space-y-4">
      {state && "error" in state && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p>
      )}
      {state && "deleted" in state && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          Deleted {state.deleted.donations} donation{state.deleted.donations === 1 ? "" : "s"},{" "}
          {state.deleted.subscriptions} subscription{state.deleted.subscriptions === 1 ? "" : "s"} and{" "}
          {state.deleted.plans} plan{state.deleted.plans === 1 ? "" : "s"}.
        </p>
      )}

      <div>
        <label className={label} htmlFor="cutoff">When did you switch Paystack to live? (Nigeria time)</label>
        <input id="cutoff" name="cutoff" type="datetime-local" required defaultValue={preview?.cutoff} className={input} />
        <p className="mt-1 text-xs text-brand-900/50">
          Everything created <strong>before</strong> this moment is treated as test data. Anything after it is kept.
        </p>
      </div>

      <button
        name="intent"
        value="preview"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-50 disabled:opacity-60"
      >
        <Eye className="h-4 w-4" aria-hidden />
        {isPending ? "Checking…" : "Preview what would be deleted"}
      </button>

      {preview && (
        <div className="space-y-4 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
          <ul className="space-y-1 text-sm text-brand-900">
            <li><strong>{preview.donations}</strong> donation record{preview.donations === 1 ? "" : "s"} will be deleted (successful ones total {formatMoney(preview.successfulTotal)})</li>
            <li><strong>{preview.subscriptions}</strong> member subscription{preview.subscriptions === 1 ? "" : "s"} will be deleted</li>
            <li><strong>{preview.plans}</strong> Paystack plan{preview.plans === 1 ? "" : "s"} will be deleted</li>
            <li className="text-emerald-800"><strong>{preview.keptDonations}</strong> donation{preview.keptDonations === 1 ? "" : "s"} made after the cutoff will be kept</li>
          </ul>

          {nothingToDelete ? (
            <p className="text-sm text-brand-900/60">Nothing found before that time.</p>
          ) : (
            <>
              <input type="hidden" name="confirmCutoff" value={preview.cutoff} />
              <input type="hidden" name="expectedDonations" value={preview.donations} />
              <input type="hidden" name="expectedSubscriptions" value={preview.subscriptions} />
              <input type="hidden" name="expectedPlans" value={preview.plans} />
              <div>
                <label className={label} htmlFor="confirmText">Type DELETE to confirm. This can&apos;t be undone.</label>
                <input id="confirmText" name="confirmText" autoComplete="off" className={input} />
              </div>
              <button
                name="intent"
                value="delete"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {isPending ? "Deleting…" : "Delete test payments"}
              </button>
            </>
          )}
        </div>
      )}
    </form>
  );
}
