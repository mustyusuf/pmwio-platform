"use client";

import { useActionState, useState } from "react";
import { HandHeart } from "lucide-react";
import { createPartner, updatePartner, type PartnerState } from "@/app/actions/partners";

const label = "block text-sm font-medium text-brand-900";
const input =
  "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

/** Name / kind / url / logo fields shared by the create and edit forms. */
function Fields({
  defaults,
  logoHint,
}: {
  defaults?: { name: string; url: string | null; kind: string };
  logoHint: string;
}) {
  return (
    <>
      <div>
        <label className={label} htmlFor="name">Name</label>
        <input id="name" name="name" defaultValue={defaults?.name} required className={input} placeholder="e.g. Al-Furqan Foundation" />
      </div>
      <div>
        <label className={label} htmlFor="kind">Show under</label>
        <select id="kind" name="kind" defaultValue={defaults?.kind ?? "PARTNER"} className={input}>
          <option value="PARTNER">Our Partners</option>
          <option value="SUPPORTER">Supported By</option>
        </select>
      </div>
      <div>
        <label className={label} htmlFor="url">Website link (optional)</label>
        <input id="url" name="url" type="url" defaultValue={defaults?.url ?? ""} className={input} placeholder="https://example.org" />
      </div>
      <div>
        <label className={label} htmlFor="logo">Logo</label>
        <input id="logo" name="logo" type="file" accept="image/*" className={`${input} file:mr-3 file:rounded-md file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-800`} />
        <p className="mt-1 text-xs text-brand-900/50">{logoHint}</p>
      </div>
    </>
  );
}

function Feedback({ state, okMessage }: { state: PartnerState; okMessage: string }) {
  if (state?.error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p>;
  if (state?.ok) return <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{okMessage}</p>;
  return null;
}

export function PartnerCreateForm() {
  const [state, action, isPending] = useActionState<PartnerState, FormData>(createPartner, null);

  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} okMessage="Added." />
      <Fields logoHint="Optional. A transparent PNG works best; without one the card shows the name's initials." />
      <button
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
      >
        <HandHeart className="h-4 w-4" aria-hidden />
        {isPending ? "Adding…" : "Add entry"}
      </button>
    </form>
  );
}

export function PartnerEditForm({
  partner,
}: {
  partner: { id: string; name: string; url: string | null; kind: string; hasLogo: boolean };
}) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState<PartnerState, FormData>(updatePartner, null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
      >
        Edit
      </button>
    );
  }

  return (
    <form action={action} className="mt-3 w-full space-y-4 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
      <input type="hidden" name="id" value={partner.id} />
      <Feedback state={state} okMessage="Changes saved." />
      <Fields
        defaults={partner}
        logoHint={partner.hasLogo ? "Leave empty to keep the current logo." : "Optional — no logo uploaded yet."}
      />
      <div className="flex gap-2">
        <button
          disabled={isPending}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-white"
        >
          Close
        </button>
      </div>
    </form>
  );
}
