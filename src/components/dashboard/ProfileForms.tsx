"use client";

import { useActionState } from "react";
import { updateProfile, changePassword, type ProfileState } from "@/app/actions/profile";

const label = "block text-sm font-medium text-brand-900";
const input = "mt-1.5 w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

function Banner({ state }: { state: ProfileState }) {
  if (state?.error) return <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{state.error}</p>;
  if (state?.ok) return <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{state.message ?? "Saved."}</p>;
  return null;
}

export function ProfileForm({
  user,
  hasImage,
}: {
  user: { name: string; email: string; userId: string; phone: string | null; country: string | null; id: string };
  hasImage: boolean;
}) {
  const [state, action] = useActionState<ProfileState, FormData>(updateProfile, null);
  return (
    <form action={action} className="space-y-4">
      <Banner state={state} />

      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-100 text-xl font-bold text-brand-700">
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/avatar/${user.id}`} alt="" className="h-full w-full object-cover" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <label htmlFor="image" className={label}>Profile image</label>
          <input id="image" name="image" type="file" accept="image/*" className="mt-1 block text-sm text-brand-900/70 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700" />
          <p className="mt-1 text-xs text-brand-900/40">JPG/PNG/GIF/WEBP, max 10MB.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className={label}>Email (read-only)</label><input value={user.email} readOnly className={`${input} bg-brand-50`} /></div>
        <div><label className={label}>User ID (read-only)</label><input value={user.userId} readOnly className={`${input} bg-brand-50 font-mono`} /></div>
      </div>
      <div><label htmlFor="name" className={label}>Full name</label><input id="name" name="name" defaultValue={user.name} required className={input} /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label htmlFor="phone" className={label}>Phone</label><input id="phone" name="phone" defaultValue={user.phone ?? ""} className={input} /></div>
        <div><label htmlFor="country" className={label}>Country</label><input id="country" name="country" defaultValue={user.country ?? ""} className={input} /></div>
      </div>
      <button className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">Save profile</button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useActionState<ProfileState, FormData>(changePassword, null);
  return (
    <form action={action} className="space-y-4">
      <Banner state={state} />
      <div><label htmlFor="current" className={label}>Current password</label><input id="current" name="current" type="password" required className={input} /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label htmlFor="next" className={label}>New password</label><input id="next" name="next" type="password" minLength={6} required className={input} /></div>
        <div><label htmlFor="confirm" className={label}>Confirm new password</label><input id="confirm" name="confirm" type="password" minLength={6} required className={input} /></div>
      </div>
      <button className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">Change password</button>
    </form>
  );
}
