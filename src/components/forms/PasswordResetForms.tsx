"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, resetPassword, type ResetRequestState, type ResetState } from "@/app/actions/profile";

const label = "block text-sm font-medium text-brand-900";
const input = "mt-1.5 w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-brand-950 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function ForgotPasswordForm() {
  const [state, action] = useActionState<ResetRequestState, FormData>(requestPasswordReset, null);

  if (state?.ok) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          If an account matches what you entered, a password reset link has been generated.
        </p>
        {state.resetUrl && (
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm">
            <p className="font-medium text-brand-900">Your reset link</p>
            <p className="mt-1 text-xs text-brand-900/60">In production this would be emailed to you. For this demo, use it directly:</p>
            <Link href={state.resetUrl} className="mt-2 inline-block break-all font-semibold text-brand-700 hover:underline">{state.resetUrl}</Link>
          </div>
        )}
        <Link href="/login" className="inline-block text-sm font-semibold text-brand-700 hover:text-brand-900">← Back to login</Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state?.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{state.error}</p>}
      <div>
        <label htmlFor="identifier" className={label}>User ID or email</label>
        <input id="identifier" name="identifier" required className={input} placeholder="PMW-XXXXXX or you@example.com" />
      </div>
      <button className="w-full rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800">Send reset link</button>
      <p className="text-center text-sm text-brand-900/60"><Link href="/login" className="font-semibold text-brand-700 hover:text-brand-900">Back to login</Link></p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState<ResetState, FormData>(resetPassword, null);

  if (state?.ok) {
    return (
      <div className="space-y-4 text-center">
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">Your password has been reset.</p>
        <Link href="/login" className="inline-block rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800">Log in</Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state?.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{state.error}</p>}
      <input type="hidden" name="token" value={token} />
      <div><label htmlFor="next" className={label}>New password</label><input id="next" name="next" type="password" minLength={6} required className={input} placeholder="At least 6 characters" /></div>
      <div><label htmlFor="confirm" className={label}>Confirm new password</label><input id="confirm" name="confirm" type="password" minLength={6} required className={input} placeholder="Re-enter password" /></div>
      <button className="w-full rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800">Reset password</button>
    </form>
  );
}
