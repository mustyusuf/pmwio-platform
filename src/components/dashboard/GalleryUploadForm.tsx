"use client";

import { useActionState, useEffect, useState } from "react";
import { Upload, X } from "lucide-react";
import { uploadGalleryImage, type GalleryState } from "@/app/actions/gallery";
import { GALLERY_CATEGORIES } from "@/lib/content";

const label = "block text-sm font-medium text-brand-900";
const input = "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function GalleryUploadForm() {
  const [state, action] = useActionState<GalleryState, FormData>(uploadGalleryImage, null);
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
        <Upload className="h-4 w-4" aria-hidden />
        Upload image
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
            aria-labelledby="upload-image-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-brand-100 bg-white shadow-2xl"
          >
            <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-brand-100 bg-white px-5 py-4">
              <div>
                <h2 id="upload-image-title" className="text-lg font-bold text-brand-950">Upload an image</h2>
                <p className="mt-0.5 text-sm text-brand-900/55">Add a categorized photo to the public gallery.</p>
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
              {state?.ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">Image uploaded.</p>}

              <div>
                <label htmlFor="category" className={label}>Category</label>
                <select id="category" name="category" required defaultValue="" autoFocus className={input}>
                  <option value="" disabled>Select category…</option>
                  {GALLERY_CATEGORIES.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="caption" className={label}>Caption</label>
                <input id="caption" name="caption" required className={input} placeholder="e.g. Scholarship award ceremony" />
              </div>

              <div>
                <label htmlFor="image" className={label}>Image</label>
                <input id="image" name="image" type="file" accept="image/*" required className="mt-1.5 block w-full text-sm text-brand-900/70 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700" />
                <p className="mt-1 text-xs text-brand-900/50">JPG, PNG, GIF or WEBP. Maximum file size: 10MB.</p>
              </div>

              <div className="flex justify-end gap-3 border-t border-brand-100 pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                >
                  Cancel
                </button>
                <button className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
                  <Upload className="h-4 w-4" aria-hidden />
                  Upload image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
