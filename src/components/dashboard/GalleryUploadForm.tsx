"use client";

import { useActionState } from "react";
import { uploadGalleryImage, type GalleryState } from "@/app/actions/gallery";
import { GALLERY_CATEGORIES } from "@/lib/content";

const label = "block text-sm font-medium text-brand-900";
const input = "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function GalleryUploadForm() {
  const [state, action] = useActionState<GalleryState, FormData>(uploadGalleryImage, null);

  return (
    <form action={action} className="space-y-3">
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{state.error}</p>}
      {state?.ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">Image uploaded.</p>}

      <div>
        <label htmlFor="category" className={label}>Category</label>
        <select id="category" name="category" required defaultValue="" className={input}>
          <option value="" disabled>Select category…</option>
          {GALLERY_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </div>
      <div><label htmlFor="caption" className={label}>Caption</label><input id="caption" name="caption" required className={input} placeholder="e.g. Scholarship award ceremony" /></div>
      <div>
        <label htmlFor="image" className={label}>Image</label>
        <input id="image" name="image" type="file" accept="image/*" required className="mt-1.5 block w-full text-sm text-brand-900/70 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700" />
        <p className="mt-1 text-xs text-brand-900/50">JPG/PNG/WEBP, max 10MB.</p>
      </div>
      <button className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Upload image</button>
    </form>
  );
}
