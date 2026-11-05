"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import Link from "next/link";
import { emailReminderToPendingMembers, emailVerseToAllMembers, type EmailVerseState } from "@/app/actions/quran";

/** Emails the live verse to every member, and shows how the last send went. */
type LastSend = { campaignId: string; sent: number; failed: number; total: number; when: string } | null;

export function EmailVerseButton({
  id,
  memberCount,
  pendingCount,
  last,
  lastReminder,
}: {
  id: string;
  memberCount: number;
  pendingCount: number;
  last: LastSend;
  lastReminder: LastSend;
}) {
  const [state, action, isPending] = useActionState<EmailVerseState, FormData>(emailVerseToAllMembers, null);
  const [remState, remAction, remPending] = useActionState<EmailVerseState, FormData>(emailReminderToPendingMembers, null);

  return (
    <div className="mt-3 rounded-xl bg-brand-50 p-3">
      <form
        action={action}
        onSubmit={(e) => {
          const ok = window.confirm(
            last
              ? `This verse was already emailed on ${last.when}. Email all ${memberCount} active member${memberCount === 1 ? "" : "s"} again?`
              : `Email this verse to all ${memberCount} active member${memberCount === 1 ? "" : "s"} now?`,
          );
          if (!ok) e.preventDefault();
        }}
        className="flex flex-wrap items-center gap-3"
      >
        <input type="hidden" name="id" value={id} />
        <button
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
        >
          <Mail className="h-4 w-4" aria-hidden />
          {isPending ? "Sending…" : last ? "Email members again" : "Email members now"}
        </button>
        <span className="text-xs text-brand-900/60">
          {last ? (
            <>
              Last emailed {last.when}: {last.sent} of {last.total} delivered
              {last.failed > 0 && <strong className="text-red-700"> · {last.failed} failed</strong>} ·{" "}
              <Link href={`/dashboard/email-log/${last.campaignId}`} className="font-semibold text-brand-700 underline">View delivery</Link>
            </>
          ) : (
            "Not emailed to members yet."
          )}
        </span>
      </form>
      {state?.error && <p className="mt-2 text-xs font-medium text-red-700">{state.error}</p>}
      {state?.message && <p className={`mt-2 text-xs font-medium ${state.warning ? "text-amber-800" : "text-emerald-800"}`}>{state.message}</p>}

      <form
        action={remAction}
        onSubmit={(e) => {
          if (!window.confirm(`Send a reminder to the ${pendingCount} member${pendingCount === 1 ? "" : "s"} who haven't submitted yet?`)) e.preventDefault();
        }}
        className="mt-3 flex flex-wrap items-center gap-3 border-t border-brand-100 pt-3"
      >
        <input type="hidden" name="id" value={id} />
        <button
          disabled={remPending || pendingCount === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-brand-300 bg-white px-3.5 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-60"
        >
          <Mail className="h-4 w-4" aria-hidden />
          {remPending ? "Sending…" : "Send reminder now"}
        </button>
        <span className="text-xs text-brand-900/60">
          {pendingCount} member{pendingCount === 1 ? "" : "s"} haven&apos;t submitted yet.{" "}
          {lastReminder && (
            <>
              Last reminder {lastReminder.when}: {lastReminder.sent} of {lastReminder.total} delivered
              {lastReminder.failed > 0 && <strong className="text-red-700"> · {lastReminder.failed} failed</strong>} ·{" "}
              <Link href={`/dashboard/email-log/${lastReminder.campaignId}`} className="font-semibold text-brand-700 underline">View delivery</Link>
            </>
          )}
        </span>
      </form>
      {remState?.error && <p className="mt-2 text-xs font-medium text-red-700">{remState.error}</p>}
      {remState?.message && <p className={`mt-2 text-xs font-medium ${remState.warning ? "text-amber-800" : "text-emerald-800"}`}>{remState.message}</p>}
    </div>
  );
}
