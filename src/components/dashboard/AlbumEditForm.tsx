"use client";

import { useActionState, useState } from "react";
import { Pencil, X, Trash2, Plus } from "lucide-react";
import { updateAlbum, addAlbumImages, updateImageCaption, deleteGalleryImage, type GalleryState } from "@/app/actions/gallery";
import { GALLERY_CATEGORIES } from "@/lib/content";

const label = "block text-sm font-medium text-brand-900";
const input = "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export type EditableAlbum = {
  id: string;
  title: string;
  description: string;
  category: string;
  publishedDate: string; // yyyy-mm-dd or ""
  draft: boolean;
  images: { id: string; caption: string; src: string }[];
};

export function AlbumEditForm({ album }: { album: EditableAlbum }) {
  const [open, setOpen] = useState(false);

  const [metaState, metaAction, metaPending] = useActionState<GalleryState, FormData>(updateAlbum, null);
  const [addState, addAction, addPending] = useActionState<GalleryState, FormData>(addAlbumImages, null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => { if (e.currentTarget === e.target) setOpen(false); }}>
          <div role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-brand-100 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-brand-100 bg-white px-5 py-4">
              <h2 className="text-lg font-bold text-brand-950">Edit album</h2>
              <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-brand-900/60 hover:bg-brand-50" aria-label="Close">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="space-y-6 p-5">
              {/* Album details */}
              <form action={metaAction} className="space-y-4">
                {metaState?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{metaState.error}</p>}
                {metaState?.ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">Album details saved.</p>}
                <input type="hidden" name="id" value={album.id} />
                <div>
                  <label htmlFor={`t-${album.id}`} className={label}>Album title</label>
                  <input id={`t-${album.id}`} name="title" required defaultValue={album.title} className={input} />
                </div>
                <div>
                  <label htmlFor={`d-${album.id}`} className={label}>Description <span className="text-brand-400">(optional)</span></label>
                  <textarea id={`d-${album.id}`} name="description" rows={3} defaultValue={album.description} className={input} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`c-${album.id}`} className={label}>Category</label>
                    <select id={`c-${album.id}`} name="category" defaultValue={album.category} className={input}>
                      {GALLERY_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`p-${album.id}`} className={label}>Publication date</label>
                    <input id={`p-${album.id}`} name="publishedAt" type="date" defaultValue={album.publishedDate} className={input} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-brand-900/80">
                  <input name="draft" type="checkbox" defaultChecked={album.draft} className="h-4 w-4 rounded border-brand-300" /> Keep as draft (hidden from public)
                </label>
                <button disabled={metaPending} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
                  {metaPending ? "Saving…" : "Save details"}
                </button>
              </form>

              {/* Existing photos */}
              <div className="border-t border-brand-100 pt-5">
                <h3 className="mb-3 text-sm font-bold text-brand-950">Photos ({album.images.length})</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {album.images.map((img, i) => (
                    <form key={img.id} className="overflow-hidden rounded-xl border border-brand-100 bg-brand-50/40">
                      <input type="hidden" name="id" value={img.id} />
                      <div className="aspect-[4/3] bg-brand-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.src} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="p-3">
                        <label className="block text-xs font-medium text-brand-900">Caption {i + 1} <span className="text-brand-400">(optional)</span></label>
                        <input name="caption" defaultValue={img.caption} placeholder="No caption" className={`${input} mt-1`} />
                        <div className="mt-2 flex items-center justify-between">
                          <button formAction={updateImageCaption} className="text-xs font-semibold text-brand-700 hover:text-brand-900">Save caption</button>
                          <button formAction={deleteGalleryImage} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800">
                            <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
                          </button>
                        </div>
                      </div>
                    </form>
                  ))}
                </div>
              </div>

              {/* Add more photos */}
              <form action={addAction} className="border-t border-brand-100 pt-5">
                {addState?.error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{addState.error}</p>}
                {addState?.ok && <p className="mb-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">Photos added.</p>}
                <input type="hidden" name="id" value={album.id} />
                <label htmlFor={`add-${album.id}`} className={label}>Add more photos</label>
                <input id={`add-${album.id}`} name="images" type="file" accept="image/*" multiple required className="mt-1.5 block w-full text-sm text-brand-900/70 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700" />
                <p className="mt-1 text-xs text-brand-900/50">Up to 20 photos, 10MB each. Captions can be added afterwards.</p>
                <button disabled={addPending} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
                  <Plus className="h-4 w-4" aria-hidden /> {addPending ? "Uploading…" : "Add photos"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
