"use client";

import { useActionState, useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { createStaffUser, type AdminState } from "@/app/actions/workflow";
import { ROLE_LABEL, COVERED_STATES } from "@/lib/roles";

const label = "block text-sm font-medium text-brand-900";
const input =
  "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function CreateUserForm() {
  const [state, action] = useActionState<AdminState, FormData>(createStaffUser, null);
  const [role, setRole] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
      >
        <UserPlus className="h-4 w-4" aria-hidden />
        Create user
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-user-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-brand-100 bg-white shadow-2xl"
          >
            <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-brand-100 bg-white px-5 py-4">
              <div>
                <h2 id="create-user-title" className="text-lg font-bold text-brand-950">Create a user</h2>
                <p className="mt-0.5 text-sm text-brand-900/55">Create a staff or organization member account.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-brand-900/60 transition hover:bg-brand-50 hover:text-brand-900"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <form action={action} className="space-y-4 p-5">
              {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p>}
              {state?.ok && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                  User created. Their User ID is <strong>{state.created}</strong>.
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="create-user-name" className={label}>Full name</label>
                  <input id="create-user-name" name="name" required autoFocus placeholder="Full name" className={input} />
                </div>
                <div>
                  <label htmlFor="create-user-email" className={label}>Email</label>
                  <input id="create-user-email" name="email" type="email" required placeholder="Email address" className={input} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="create-user-role" className={label}>Role</label>
                  <select id="create-user-role" name="role" required value={role} onChange={(e) => setRole(e.target.value)} className={input}>
                    <option value="" disabled>Select role…</option>
                    {["EXECUTIVE", "BOARD", "ADMIN", "FINANCE", "COORDINATOR", "MEMBER"].map((userRole) => (
                      <option key={userRole} value={userRole}>{ROLE_LABEL[userRole]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="create-user-password" className={label}>Temporary password</label>
                  <input id="create-user-password" name="password" type="password" required minLength={6} placeholder="At least 6 characters" className={input} />
                </div>
              </div>

              {role === "COORDINATOR" && (
                <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-700">States represented</p>
                  <div className="flex flex-wrap gap-3">
                    {COVERED_STATES.map((stateName) => (
                      <label key={stateName} className="flex items-center gap-1.5 text-sm text-brand-900/80">
                        <input type="checkbox" name="states" value={stateName} className="h-4 w-4 rounded border-brand-300" />
                        {stateName}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-brand-100 pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                >
                  Cancel
                </button>
                <button className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
                  <UserPlus className="h-4 w-4" aria-hidden />
                  Create user
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
