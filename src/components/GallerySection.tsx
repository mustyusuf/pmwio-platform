"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { GALLERY_CATEGORIES } from "@/lib/content";
import type { GalleryDTO } from "@/lib/gallery";

const TABS = [{ key: "ALL", label: "All" }, ...GALLERY_CATEGORIES];

export function GallerySection({
  items,
  heading = true,
  background = true,
}: {
  items: GalleryDTO[];
  heading?: boolean;
  background?: boolean;
}) {
  const [active, setActive] = useState("ALL");
  const shown = active === "ALL" ? items : items.filter((g) => g.category === active);
  // Only show tabs for categories that actually have images.
  const present = new Set(items.map((i) => i.category));
  const tabs = TABS.filter((t) => t.key === "ALL" || present.has(t.key));

  // Index of the image open in the lightbox, or null when closed.
  const [lightbox, setLightbox] = useState<number | null>(null);
  const open = lightbox !== null;

  const close = useCallback(() => setLightbox(null), []);
  const prev = useCallback(
    () => setLightbox((i) => (i === null ? i : (i - 1 + shown.length) % shown.length)),
    [shown.length],
  );
  const next = useCallback(
    () => setLightbox((i) => (i === null ? i : (i + 1) % shown.length)),
    [shown.length],
  );

  // Keyboard navigation + lock body scroll while the lightbox is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close, prev, next]);

  // Touch swipe to move sideways between images.
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) (delta < 0 ? next : prev)();
    touchStartX.current = null;
  };

  return (
    <section id="gallery" className={background ? "bg-brand-50/60 py-20" : "py-4"}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {heading && (
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">Gallery</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">Moments from our work</h2>
            <p className="mt-4 text-lg text-brand-900/70">A glimpse of the lives we touch across our programs.</p>
          </div>
        )}

        <div className={`${heading ? "mt-8" : ""} flex flex-wrap justify-center gap-2`}>
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active === t.key ? "bg-brand-700 text-white shadow-sm" : "border border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <p className="mt-10 text-center text-sm text-brand-900/50">No images in this category yet.</p>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((g, i) => (
              <figure key={g.id} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-950 shadow-sm">
                <button
                  type="button"
                  onClick={() => setLightbox(i)}
                  className="block h-full w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  aria-label={`View image: ${g.caption}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.src} alt={g.caption} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </button>
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-950/80 to-transparent p-3">
                  <span className="text-xs font-semibold text-white">{g.caption}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={close}
        >
          {/* Close */}
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Prev / Next (hidden when there's only one image) */}
          {shown.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 sm:left-4"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 sm:right-4"
                aria-label="Next image"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}

          {/* Sliding track — translateX moves sideways to the active image. */}
          <div
            className="h-full w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${lightbox * 100}%)` }}
            >
              {shown.map((g) => (
                <figure key={g.id} className="flex h-full w-full flex-shrink-0 flex-col items-center justify-center gap-4 px-6 py-12 sm:px-16">
                  {/* Fixed-size frame so every slide is identical; the image is
                      scaled to fit inside it (object-contain) without cropping. */}
                  <div className="flex h-[70vh] w-full max-w-4xl items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.src} alt={g.caption} className="max-h-full max-w-full rounded-lg object-contain" draggable={false} />
                  </div>
                  <figcaption className="max-w-2xl text-center text-sm text-white/90">{g.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>

          {/* Counter */}
          {shown.length > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
              {lightbox + 1} / {shown.length}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
