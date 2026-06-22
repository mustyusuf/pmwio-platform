"use client";

import { useActionState } from "react";
import { CircleCheckBig } from "lucide-react";
import { registerAction, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "./SubmitButton";
import { PasswordInput } from "./PasswordInput";

const label = "block text-sm font-medium text-brand-900";
const input =
  "mt-1.5 w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-brand-950 outline-none transition placeholder:text-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function RegisterForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(
    registerAction,
    null,
  );

  if (state?.pending) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CircleCheckBig className="mx-auto h-9 w-9 text-emerald-700" aria-hidden />
        <h3 className="mt-2 text-lg font-bold text-emerald-900">Registration received</h3>
        <p className="mt-2 text-sm text-emerald-800">
          Your membership is <strong>awaiting administrator approval</strong>. We&apos;ll verify your
          details and activate your account — you can log in once it&apos;s approved.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="name" className={label}>Full name</label>
        <input id="name" name="name" required autoComplete="name" className={input} placeholder="Aisha Bello" />
      </div>

      <div>
        <label htmlFor="email" className={label}>Email address</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={input} placeholder="you@example.com" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className={label}>Phone <span className="text-brand-400">(optional)</span></label>
          <input id="phone" name="phone" autoComplete="tel" className={input} placeholder="+234…" />
        </div>
        <div>
          <label htmlFor="country" className={label}>Country <span className="text-brand-400">(optional)</span></label>
          <input id="country" name="country" autoComplete="country-name" className={input} placeholder="Nigeria" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="password" className={label}>Password</label>
          <PasswordInput
            id="password"
            name="password"
            minLength={6}
            autoComplete="new-password"
            className={input}
            placeholder="At least 6 characters"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className={label}>Confirm password</label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            minLength={6}
            autoComplete="new-password"
            className={input}
            placeholder="Re-enter password"
          />
        </div>
      </div>

      <p className="rounded-xl bg-brand-50 px-4 py-3 text-xs text-brand-900/70 ring-1 ring-brand-100">
        On joining you&apos;ll receive a unique <strong>User ID</strong> (your
        Referee ID) — use it to log in and to refer applicants.
      </p>

      <SubmitButton pendingText="Creating your account…">
        Create my account
      </SubmitButton>
    </form>
  );
}
