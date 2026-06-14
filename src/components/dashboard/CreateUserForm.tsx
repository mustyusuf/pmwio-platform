"use client";

import { useActionState, useState } from "react";
import { createStaffUser, type AdminState } from "@/app/actions/workflow";
import { ROLE_LABEL, COVERED_STATES } from "@/lib/roles";

const input =
  "w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function CreateUserForm() {
  const [state, action] = useActionState<AdminState, FormData>(createStaffUser, null);
  const [role, setRole] = useState("");

  return (
    <form action={action} className="space-y-3">
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{state.error}</p>}
      {state?.ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
          User created. Their User ID is <strong>{state.created}</strong>.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" required placeholder="Full name" className={input} />
        <input name="email" type="email" required placeholder="Email" className={input} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="role" required value={role} onChange={(e) => setRole(e.target.value)} className={input}>
          <option value="" disabled>Select role…</option>
          {["EXECUTIVE", "BOARD", "ADMIN", "FINANCE", "COORDINATOR", "MEMBER"].map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </select>
        <input name="password" type="password" required minLength={6} placeholder="Temporary password" className={input} />
      </div>

      {role === "COORDINATOR" && (
        <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-3">
          <p className="mb-2 text-xs font-semibold text-brand-900">States represented</p>
          <div className="flex flex-wrap gap-3">
            {COVERED_STATES.map((s) => (
              <label key={s} className="flex items-center gap-1.5 text-sm text-brand-900/80">
                <input type="checkbox" name="states" value={s} className="h-4 w-4 rounded border-brand-300" /> {s}
              </label>
            ))}
          </div>
        </div>
      )}

      <button className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Create user</button>
    </form>
  );
}
