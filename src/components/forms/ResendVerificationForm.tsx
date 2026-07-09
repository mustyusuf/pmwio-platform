"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { resendVerification, type ResendVerificationState } from "@/app/actions/auth";

const label = "block text-sm font-medium text-brand-900";
const input = "mt-1.5 w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-brand-950 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function ResendVerificationForm() {
  const [state, action] = useActionState<ResendVerificationState, FormData>(resendVerification, null);

  if (state?.ok) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          If an unverified account matches what you entered, a new confirmation link has been sent to its email address.
        </p>
        <Link href="/login" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900">
          <ArrowLeft className="h-4 w-4" aria-hidden />Back to login
        </Link>
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
      <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800">
        <Send className="h-4 w-4" aria-hidden />Send a new confirmation link
      </button>
      <p className="text-center text-sm text-brand-900/60"><Link href="/login" className="font-semibold text-brand-700 hover:text-brand-900">Back to login</Link></p>
    </form>
  );
}
