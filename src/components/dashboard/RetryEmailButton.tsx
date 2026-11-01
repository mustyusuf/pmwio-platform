"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { retryEmailCampaign, type RetryState } from "@/app/actions/email-log";

export function RetryEmailButton({ id, failed }: { id: string; failed: number }) {
  const [state, action, isPending] = useActionState<RetryState, FormData>(retryEmailCampaign, null);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <button
        disabled={isPending || failed === 0}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} aria-hidden />
        {isPending ? "Retrying…" : failed === 0 ? "Nothing to retry" : `Retry ${failed} failed`}
      </button>
      {state?.error && <p className="text-sm font-medium text-red-700">{state.error}</p>}
      {state?.ok && <p className="text-sm font-medium text-emerald-800">{state.message}</p>}
    </form>
  );
}
