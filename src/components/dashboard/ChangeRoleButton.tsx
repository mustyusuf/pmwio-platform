"use client";

import { useActionState, useState } from "react";
import { UserCog } from "lucide-react";
import { changeUserRole, type ChangeRoleState } from "@/app/actions/workflow";
import { ROLE_LABEL, ROLE_TAGLINE, COVERED_STATES } from "@/lib/roles";

const ASSIGNABLE = ["EXECUTIVE", "BOARD", "ADMIN", "FINANCE", "COORDINATOR", "MEMBER", "BENEFICIARY"];

export function ChangeRoleButton({
  userId,
  name,
  currentRole,
  currentStates,
}: {
  userId: string;
  name: string;
  currentRole: string;
  currentStates: string[];
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(currentRole);

  const [state, action, isPending] = useActionState<ChangeRoleState, FormData>(async (prev, formData) => {
    const next = await changeUserRole(prev, formData);
    if (next?.ok) setOpen(false);
    return next;
  }, null);

  const close = () => {
    setRole(currentRole);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-brand-700 hover:text-brand-900"
      >
        Change role
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) close();
          }}
        >
          <form
            action={action}
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-role-title"
            className="w-full max-w-md rounded-2xl border border-brand-100 bg-white p-6 text-left shadow-2xl"
          >
            <input type="hidden" name="userId" value={userId} />

            <div className="grid h-11 w-11 place-items-center rounded-full bg-brand-100 text-brand-700">
              <UserCog className="h-5 w-5" aria-hidden />
            </div>
            <h2 id="change-role-title" className="mt-4 text-lg font-bold text-brand-950">
              Change role
            </h2>
            <p className="mt-1 text-sm text-brand-900/65">
              <strong>{name}</strong> is currently {ROLE_LABEL[currentRole] ?? currentRole}.
            </p>

            <div className="mt-4">
              <label htmlFor="change-role-select" className="block text-sm font-medium text-brand-900">
                New role
              </label>
              <select
                id="change-role-select"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              >
                {ASSIGNABLE.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r] ?? r}
                    {r === currentRole ? " (current)" : ""}
                  </option>
                ))}
              </select>
              {ROLE_TAGLINE[role] && <p className="mt-1.5 text-xs text-brand-900/50">{ROLE_TAGLINE[role]}</p>}
            </div>

            {/* State Coordinators must declare the states they cover. */}
            {role === "COORDINATOR" && (
              <div className="mt-4 rounded-lg border border-brand-100 bg-brand-50/60 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-700">States represented</p>
                <div className="flex flex-wrap gap-3">
                  {COVERED_STATES.map((stateName) => (
                    <label key={stateName} className="flex items-center gap-1.5 text-sm text-brand-900/80">
                      <input
                        type="checkbox"
                        name="states"
                        value={stateName}
                        defaultChecked={currentStates.includes(stateName)}
                        className="h-4 w-4 rounded border-brand-300"
                      />
                      {stateName}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {state?.error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-brand-100 pt-4">
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
              >
                Cancel
              </button>
              <button
                disabled={isPending || role === currentRole}
                className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
              >
                {isPending ? "Saving…" : "Save role"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
