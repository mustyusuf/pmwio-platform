"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { GALLERY_CATEGORIES } from "@/lib/content";
import type { GalleryAlbumDTO, GalleryPhotoDTO } from "@/lib/gallery";

const TABS = [{ key: "ALL", label: "All" }, ...GALLERY_CATEGORIES];

type Slide = { src: string; caption: string };
type Viewer = {
  slides: Slide[];
  index: number;
  album?: { title: string; publishedAt: string | null };
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

export function GallerySection({
  albums = [],
  photos = [],
  heading = true,
  background = true,
  limit,
}: {
  albums?: GalleryAlbumDTO[];
  photos?: GalleryPhotoDTO[];
  heading?: boolean;
  background?: boolean;
  limit?: number;
}) {
  const [active, setActive] = useState("ALL");

  // Only show tabs for categories that actually have content.
  const present = new Set<string>([...albums.map((a) => a.category), ...photos.map((p) => p.category)]);
  const tabs = TABS.filter((t) => t.key === "ALL" || present.has(t.key));

  const shownAlbums = active === "ALL" ? albums : albums.filter((a) => a.category === active);
  const shownPhotos = active === "ALL" ? photos : photos.filter((p) => p.category === active);

  // Optional cap on total tiles (used for the homepage teaser).
  const albumTiles = limit ? shownAlbums.slice(0, limit) : shownAlbums;
  const photoTiles = limit ? shownPhotos.slice(0, Math.max(0, limit - albumTiles.length)) : shownPhotos;
  const hasContent = albumTiles.length > 0 || photoTiles.length > 0;

  // Lightbox carousel — a list of slides plus the active index, or null.
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const open = viewer !== null;

  const close = useCallback(() => setViewer(null), []);
  const prev = useCallback(
    () => setViewer((v) => (v ? { ...v, index: (v.index - 1 + v.slides.length) % v.slides.length } : v)),
    [],
  );
  const next = useCallback(
    () => setViewer((v) => (v ? { ...v, index: (v.index + 1) % v.slides.length } : v)),
    [],
  );

  const openAlbum = (album: GalleryAlbumDTO) =>
    setViewer({
      slides: album.images.map((g) => ({ src: g.src, caption: g.caption })),
      index: 0,
      album: { title: album.title, publishedAt: album.publishedAt },
    });
  const openPhoto = (index: number) =>
    setViewer({ slides: photoTiles.map((p) => ({ src: p.src, caption: p.caption })), index });

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

  // Touch swipe to move sideways between slides.
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

        {tabs.length > 1 && (
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
        )}

        {!hasContent ? (
          <p className="mt-10 text-center text-sm text-brand-900/50">No images in this category yet.</p>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {/* Album tiles — a cover that opens the album's carousel. */}
            {albumTiles.map((album) => {
              const date = formatDate(album.publishedAt);
              return (
                <figure key={`album-${album.id}`} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-950 shadow-sm">
                  {/* Stacked-card hint behind the cover */}
                  <span aria-hidden className="absolute inset-x-2 -top-1 h-2 rounded-t-xl bg-white/30" />
                  <button
                    type="button"
                    onClick={() => openAlbum(album)}
                    className="block h-full w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    aria-label={`Open album: ${album.title} (${album.count} photos)`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={album.cover} alt={album.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand-950/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                      <Images className="h-3 w-3" aria-hidden /> {album.count}
                    </span>
                  </button>
                  <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-950/85 to-transparent p-3">
                    <span className="block text-sm font-semibold text-white">{album.title}</span>
                    {date && <span className="block text-[11px] text-white/70">{date}</span>}
                  </figcaption>
                </figure>
              );
            })}

            {/* Loose photo tiles */}
            {photoTiles.map((g, i) => (
              <figure key={`photo-${g.id}`} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-950 shadow-sm">
                <button
                  type="button"
                  onClick={() => openPhoto(i)}
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

      {viewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          {viewer.slides.length > 1 && (
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

          {/* Sliding track — translateX moves sideways to the active slide. */}
          <div
            className="h-full w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${viewer.index * 100}%)` }}
            >
              {viewer.slides.map((s, i) => {
                const date = viewer.album ? formatDate(viewer.album.publishedAt) : null;
                return (
                  <div key={i} className="flex h-full w-full flex-shrink-0 items-center justify-center px-10 py-14 sm:px-20">
                    <article className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                      {viewer.album && (
                        <header className="shrink-0 border-b border-black/10 px-4 py-3 sm:px-5">
                          <h3 className="font-semibold text-brand-950">{viewer.album.title}</h3>
                          {date && <p className="mt-0.5 text-xs text-brand-900/55">{date}</p>}
                        </header>
                      )}
                      <figure className="min-h-0 overflow-y-auto">
                        <div className="flex min-h-0 max-h-[68vh] items-center justify-center bg-black">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.src} alt={s.caption} className="max-h-[68vh] w-auto max-w-full object-contain" draggable={false} />
                        </div>
                        <figcaption className="bg-white px-4 py-4 text-sm leading-relaxed text-brand-950 sm:px-5">
                          {s.caption}
                        </figcaption>
                      </figure>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>

          {viewer.slides.length > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
              {viewer.index + 1} / {viewer.slides.length}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
