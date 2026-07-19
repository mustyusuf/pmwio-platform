"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";
import { createTeamMember, updateTeamMember, type TeamState } from "@/app/actions/team";

const label = "block text-sm font-medium text-brand-900";
const input =
  "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

/** Name / role / bio / portrait fields shared by the create and edit forms. */
function Fields({
  defaults,
  imageHint,
}: {
  defaults?: { name: string; role: string; bio: string | null };
  imageHint: string;
}) {
  return (
    <>
      <div>
        <label className={label} htmlFor="name">Full name</label>
        <input id="name" name="name" defaultValue={defaults?.name} required className={input} placeholder="e.g. Aisha Bello" />
      </div>
      <div>
        <label className={label} htmlFor="role">Role / title</label>
        <input id="role" name="role" defaultValue={defaults?.role} required className={input} placeholder="e.g. Founder & President" />
      </div>
      <div>
        <label className={label} htmlFor="bio">Short description (optional)</label>
        <textarea id="bio" name="bio" defaultValue={defaults?.bio ?? ""} rows={3} maxLength={400} className={input} />
      </div>
      <div>
        <label className={label} htmlFor="image">Photo</label>
        <input id="image" name="image" type="file" accept="image/*" className={`${input} file:mr-3 file:rounded-md file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-800`} />
        <p className="mt-1 text-xs text-brand-900/50">{imageHint}</p>
      </div>
    </>
  );
}

function Feedback({ state, okMessage }: { state: TeamState; okMessage: string }) {
  if (state?.error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p>;
  if (state?.ok) return <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{okMessage}</p>;
  return null;
}

export function TeamMemberCreateForm() {
  const [state, action, isPending] = useActionState<TeamState, FormData>(createTeamMember, null);

  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} okMessage="Team member added." />
      <Fields imageHint="Optional. A square photo works best; without one the card shows their initials." />
      <button
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
      >
        <UserPlus className="h-4 w-4" aria-hidden />
        {isPending ? "Adding…" : "Add team member"}
      </button>
    </form>
  );
}

export function TeamMemberEditForm({
  member,
}: {
  member: { id: string; name: string; role: string; bio: string | null; hasImage: boolean };
}) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState<TeamState, FormData>(updateTeamMember, null);

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
    // w-full so it wraps onto its own line inside the card's action row.
    <form action={action} className="mt-3 w-full space-y-4 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
      <input type="hidden" name="id" value={member.id} />
      <Feedback state={state} okMessage="Changes saved." />
      <Fields
        defaults={member}
        imageHint={member.hasImage ? "Leave empty to keep the current photo." : "Optional — no photo uploaded yet."}
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
