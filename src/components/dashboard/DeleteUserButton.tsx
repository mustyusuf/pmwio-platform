"use client";

import { useActionState, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { deleteUser, type DeleteUserState } from "@/app/actions/workflow";

export function DeleteUserButton({ userId, name, role }: { userId: string; name: string; role: string }) {
  const [open, setOpen] = useState(false);
  // Close the dialog once the account is gone; a refusal keeps it open so the
  // administrator can read why.
  const [state, action, isPending] = useActionState<DeleteUserState, FormData>(async (prev, formData) => {
    const next = await deleteUser(prev, formData);
    if (next?.ok) setOpen(false);
    return next;
  }, null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-red-700 hover:text-red-900"
      >
        Delete
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            className="w-full max-w-md rounded-2xl border border-brand-100 bg-white p-6 text-left shadow-2xl"
          >
            <div className="grid h-11 w-11 place-items-center rounded-full bg-red-100 text-red-700">
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </div>
            <h2 id="delete-user-title" className="mt-4 text-lg font-bold text-brand-950">
              Delete this account?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-900/65">
              <strong>{name}</strong> ({role}) will be permanently deleted, along with their login
              and notifications. Donations and applications they are linked to are kept for the
              records but will no longer show an account. This cannot be undone.
            </p>

            {state?.error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
              >
                Cancel
              </button>
              <form action={action}>
                <input type="hidden" name="userId" value={userId} />
                <button
                  disabled={isPending}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {isPending ? "Deleting…" : "Delete account"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
