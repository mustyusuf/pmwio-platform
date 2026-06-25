"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Images, X } from "lucide-react";
import { createAlbum, type GalleryState } from "@/app/actions/gallery";
import { GALLERY_CATEGORIES } from "@/lib/content";

const label = "block text-sm font-medium text-brand-900";
const input = "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";
const MAX_ALBUM_IMAGES = 20;
const MAX_ALBUM_BYTES = 80 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
type ImagePreview = { name: string; url: string; size: number };

function formatMegabytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AlbumCreateForm() {
  const [open, setOpen] = useState(false);
  const [previews, setPreviews] = useState<ImagePreview[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const previewsRef = useRef<ImagePreview[]>([]);

  const clearPreviews = () => {
    for (const preview of previewsRef.current) URL.revokeObjectURL(preview.url);
    previewsRef.current = [];
    setPreviews([]);
    setSelectionError(null);
  };

  useEffect(() => () => {
    for (const preview of previewsRef.current) URL.revokeObjectURL(preview.url);
  }, []);

  const [state, action, isPending] = useActionState<GalleryState, FormData>(async (previousState, formData) => {
    const nextState = await createAlbum(previousState, formData);
    if (nextState?.ok) {
      clearPreviews();
      setOpen(false);
    }
    return nextState;
  }, null);

  const close = () => {
    clearPreviews();
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
      >
        <Images className="h-4 w-4" aria-hidden />
        Create album
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-album-title"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-brand-100 bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-brand-100 bg-white px-5 py-4">
              <div>
                <h2 id="create-album-title" className="text-lg font-bold text-brand-950">Create an album</h2>
                <p className="mt-0.5 text-sm text-brand-900/55">Group several photos under one title.</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-brand-900/60 transition hover:bg-brand-50 hover:text-brand-900"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <form action={action} className="space-y-4 p-5">
              {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p>}

              <div>
                <label htmlFor="album-title" className={label}>Album title</label>
                <input id="album-title" name="title" required autoFocus className={input} placeholder="e.g. 2026 Scholarship Awards" />
              </div>

              <div>
                <label htmlFor="album-category" className={label}>Category</label>
                <select id="album-category" name="category" required defaultValue="" className={input}>
                  <option value="" disabled>Select category…</option>
                  {GALLERY_CATEGORIES.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="published-at" className={label}>Publication date</label>
                <input id="published-at" name="publishedAt" type="date" className={input} />
                <p className="mt-1 text-xs text-brand-900/50">Optional for drafts. Published albums without a date use today.</p>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-3">
                <input name="draft" type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-500" />
                <span>
                  <span className="block text-sm font-medium text-brand-900">Save as draft</span>
                  <span className="block text-xs text-brand-900/55">Draft albums stay hidden from the public gallery.</span>
                </span>
              </label>

              <div>
                <label htmlFor="album-images" className={label}>Photos</label>
                <input
                  id="album-images"
                  name="images"
                  type="file"
                  accept="image/*"
                  multiple
                  required
                  onChange={(event) => {
                    for (const preview of previewsRef.current) URL.revokeObjectURL(preview.url);
                    const files = Array.from(event.target.files ?? []);
                    const oversizedFile = files.find((file) => file.size > MAX_IMAGE_BYTES);
                    const totalBytes = files.reduce((total, file) => total + file.size, 0);
                    let error: string | null = null;
                    if (files.length > MAX_ALBUM_IMAGES) {
                      error = `Select no more than ${MAX_ALBUM_IMAGES} photos per album.`;
                    } else if (oversizedFile) {
                      error = `${oversizedFile.name} is larger than 10 MB.`;
                    } else if (totalBytes > MAX_ALBUM_BYTES) {
                      error = `These photos total ${formatMegabytes(totalBytes)}. Keep one album below 80 MB.`;
                    }
                    if (error) {
                      previewsRef.current = [];
                      setPreviews([]);
                      setSelectionError(error);
                      event.target.value = "";
                      return;
                    }
                    const nextPreviews = files.map((file) => ({
                      name: file.name,
                      url: URL.createObjectURL(file),
                      size: file.size,
                    }));
                    previewsRef.current = nextPreviews;
                    setPreviews(nextPreviews);
                    setSelectionError(null);
                  }}
                  className="mt-1.5 block w-full text-sm text-brand-900/70 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700"
                />
                <p className="mt-1 text-xs text-brand-900/50">Select up to 20 JPG, PNG, GIF or WEBP files. Maximum 10MB each and 80MB combined.</p>
                {selectionError && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{selectionError}</p>}
              </div>

              {previews.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-brand-950">Photo previews and captions</h3>
                    <span className="text-xs text-brand-900/50">{previews.length} selected</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {previews.map((preview, index) => (
                      <div key={`${preview.name}-${index}`} className="overflow-hidden rounded-xl border border-brand-100 bg-brand-50/40">
                        <div className="aspect-[4/3] bg-brand-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={preview.url} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="p-3">
                          <p className="truncate text-xs text-brand-900/50" title={preview.name}>
                            {preview.name} · {formatMegabytes(preview.size)}
                          </p>
                          <label htmlFor={`album-caption-${index}`} className="mt-2 block text-sm font-medium text-brand-900">
                            Caption
                          </label>
                          <input
                            id={`album-caption-${index}`}
                            name="captions"
                            required
                            className={input}
                            placeholder={`Describe photo ${index + 1}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-brand-100 pt-4">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isPending || previews.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Images className="h-4 w-4" aria-hidden />
                  {isPending ? "Creating album…" : "Create album"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
