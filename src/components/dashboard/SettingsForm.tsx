"use client";

import { useActionState } from "react";
import { updateSettings, type AdminState } from "@/app/actions/workflow";

const input = "mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function SettingsForm({
  boardQuorum,
  executiveQuorum,
  eligibleBoard,
  eligibleExec,
}: {
  boardQuorum: number;
  executiveQuorum: number;
  eligibleBoard: number;
  eligibleExec: number;
}) {
  const [state, action] = useActionState<AdminState, FormData>(updateSettings, null);

  return (
    <form action={action} className="max-w-md space-y-4">
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p>}
      {state?.ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">Settings saved.</p>}

      <div>
        <label htmlFor="boardQuorum" className="block text-sm font-medium text-brand-900">Board approvals required</label>
        <input id="boardQuorum" name="boardQuorum" type="number" min={1} max={20} defaultValue={boardQuorum} className={input} />
        <p className="mt-1 text-xs text-brand-900/50">{eligibleBoard} active board member(s). e.g. set to 3 for “3 of 5”.</p>
      </div>

      <div>
        <label htmlFor="executiveQuorum" className="block text-sm font-medium text-brand-900">Executive approvals required</label>
        <input id="executiveQuorum" name="executiveQuorum" type="number" min={1} max={20} defaultValue={executiveQuorum} className={input} />
        <p className="mt-1 text-xs text-brand-900/50">{eligibleExec} active executive(s). Applies to applications and payments.</p>
      </div>

      <button className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">Save settings</button>
    </form>
  );
}
