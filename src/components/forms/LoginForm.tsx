"use client";

import { useActionState } from "react";
import { loginAction, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "./SubmitButton";

const label = "block text-sm font-medium text-brand-900";
const input =
  "mt-1.5 w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-brand-950 outline-none transition placeholder:text-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function LoginForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(
    loginAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="identifier" className={label}>User ID or email</label>
        <input id="identifier" name="identifier" required autoComplete="username" className={input} placeholder="PMW-XXXXXX or you@example.com" />
        <p className="mt-1 text-xs text-brand-900/50">
          Use the User ID you received when you joined, or your email.
        </p>
      </div>

      <div>
        <label htmlFor="password" className={label}>Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={input} placeholder="Your password" />
      </div>

      <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
    </form>
  );
}
