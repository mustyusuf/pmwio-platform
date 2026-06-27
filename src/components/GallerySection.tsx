"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images, X, Calendar } from "lucide-react";
import { GALLERY_CATEGORIES } from "@/lib/content";
import type { GalleryAlbumDTO, GalleryPhotoDTO } from "@/lib/gallery";

const TABS = [{ key: "ALL", label: "All" }, ...GALLERY_CATEGORIES];
const CAT_LABEL: Record<string, string> = Object.fromEntries(GALLERY_CATEGORIES.map((c) => [c.key, c.label]));

type Slide = { src: string; caption: string };
type ViewerInfo = { category: string; title: string; description: string | null; publishedAt: string | null; count: number };
type Viewer = { slides: Slide[]; index: number; info: ViewerInfo };

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  // Use a fixed locale so the server and client render identical text (avoids a
  // hydration mismatch when the visitor's locale differs from the server's).
  return isNaN(d.getTime()) ? null : d.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export function GallerySection({
  albums = [],
  photos = [],
  heading = true,
  background = true,
  limit,
  headingEyebrow = "Gallery",
  headingTitle = "Moments from our work",
  headingSubtitle = "A glimpse of the lives we touch across our programs.",
}: {
  albums?: GalleryAlbumDTO[];
  photos?: GalleryPhotoDTO[];
  heading?: boolean;
  background?: boolean;
  limit?: number;
  headingEyebrow?: string;
  headingTitle?: string;
  headingSubtitle?: string;
}) {
  const [active, setActive] = useState("ALL");

  const present = new Set<string>([...albums.map((a) => a.category), ...photos.map((p) => p.category)]);
  const tabs = TABS.filter((t) => t.key === "ALL" || present.has(t.key));

  const shownAlbums = active === "ALL" ? albums : albums.filter((a) => a.category === active);
  const shownPhotos = active === "ALL" ? photos : photos.filter((p) => p.category === active);

  const albumTiles = limit ? shownAlbums.slice(0, limit) : shownAlbums;
  const photoTiles = limit ? shownPhotos.slice(0, Math.max(0, limit - albumTiles.length)) : shownPhotos;
  const hasContent = albumTiles.length > 0 || photoTiles.length > 0;

  const [viewer, setViewer] = useState<Viewer | null>(null);
  const open = viewer !== null;

  const close = useCallback(() => setViewer(null), []);
  const prev = useCallback(() => setViewer((v) => (v ? { ...v, index: (v.index - 1 + v.slides.length) % v.slides.length } : v)), []);
  const next = useCallback(() => setViewer((v) => (v ? { ...v, index: (v.index + 1) % v.slides.length } : v)), []);

  const openAlbum = (album: GalleryAlbumDTO) =>
    setViewer({
      slides: album.images.map((g) => ({ src: g.src, caption: g.caption })),
      index: 0,
      info: { category: album.category, title: album.title, description: album.description, publishedAt: album.publishedAt, count: album.count },
    });
  const openPhoto = (index: number) =>
    setViewer({
      slides: photoTiles.map((p) => ({ src: p.src, caption: p.caption })),
      index,
      info: { category: photoTiles[index]?.category ?? "", title: "Photo", description: null, publishedAt: null, count: photoTiles.length },
    });

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

  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) (delta < 0 ? next : prev)();
    touchStartX.current = null;
  };

  const currentCaption = viewer?.slides[viewer.index]?.caption ?? "";
  const viewerDate = viewer ? formatDate(viewer.info.publishedAt) : null;
  // For loose photos the "title" is the current caption.
  const isPhotoViewer = viewer?.info.title === "Photo";

  return (
    <section id="gallery" className={background ? "bg-brand-50/60 py-20" : "py-4"}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {heading && (
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">{headingEyebrow}</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">{headingTitle}</h2>
            <p className="mt-4 text-lg text-brand-900/70">{headingSubtitle}</p>
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
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Album cards — blog style: feature image on top, text below. */}
            {albumTiles.map((album) => {
              const date = formatDate(album.publishedAt);
              return (
                <button
                  key={`album-${album.id}`}
                  type="button"
                  onClick={() => openAlbum(album)}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-brand-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={album.cover} alt={album.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-950/80 px-2.5 py-1 text-[11px] font-semibold text-white">
                      <Images className="h-3 w-3" aria-hidden /> {album.count}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">{CAT_LABEL[album.category] ?? album.category}</span>
                    <h3 className="mt-1.5 text-lg font-bold leading-snug text-brand-950">{album.title}</h3>
                    {album.description && <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-brand-900/70">{album.description}</p>}
                    <div className="mt-3 flex items-center gap-2 text-xs text-brand-900/50">
                      {date && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" aria-hidden /> {date}</span>}
                      <span className="ml-auto font-semibold text-brand-700 group-hover:text-brand-900">View album →</span>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Loose photo cards */}
            {photoTiles.map((g, i) => (
              <button
                key={`photo-${g.id}`}
                type="button"
                onClick={() => openPhoto(i)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-brand-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.src} alt={g.caption || "Gallery photo"} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">{CAT_LABEL[g.category] ?? g.category}</span>
                  {g.caption && <p className="mt-1.5 text-sm font-medium leading-snug text-brand-900/80">{g.caption}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox — image carousel on one side, album details on the other. */}
      {viewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={viewer.info.title}
          onClick={close}
        >
          <button type="button" onClick={close} className="absolute right-3 top-3 z-20 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20" aria-label="Close">
            <X className="h-6 w-6" />
          </button>

          <div
            className="grid max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-[1.7fr_1fr]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image pane */}
            <div className="relative flex items-center justify-center bg-black" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
              <div className="h-[44vh] w-full overflow-hidden lg:h-[92vh]">
                <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${viewer.index * 100}%)` }}>
                  {viewer.slides.map((s, i) => (
                    <div key={i} className="flex h-full w-full flex-shrink-0 items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.src} alt={s.caption} className="max-h-full w-auto max-w-full object-contain" draggable={false} />
                    </div>
                  ))}
                </div>
              </div>

              {viewer.slides.length > 1 && (
                <>
                  <button type="button" onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20" aria-label="Previous image">
                    <ChevronLeft className="h-7 w-7" />
                  </button>
                  <button type="button" onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20" aria-label="Next image">
                    <ChevronRight className="h-7 w-7" />
                  </button>
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                    {viewer.index + 1} / {viewer.slides.length}
                  </span>
                </>
              )}
            </div>

            {/* Details pane */}
            <aside className="max-h-[48vh] overflow-y-auto p-6 lg:max-h-[92vh]">
              <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">{CAT_LABEL[viewer.info.category] ?? viewer.info.category}</span>
              <h3 className="mt-3 text-xl font-bold leading-snug text-brand-950">
                {isPhotoViewer ? (currentCaption || "Gallery photo") : viewer.info.title}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-900/55">
                {viewerDate && <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" aria-hidden /> {viewerDate}</span>}
                {!isPhotoViewer && <span className="inline-flex items-center gap-1"><Images className="h-4 w-4" aria-hidden /> {viewer.info.count} {viewer.info.count === 1 ? "photo" : "photos"}</span>}
              </div>
              {viewer.info.description && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-brand-900/75">{viewer.info.description}</p>}
              {!isPhotoViewer && currentCaption && (
                <div className="mt-4 border-t border-brand-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">This photo</p>
                  <p className="mt-1 text-sm leading-relaxed text-brand-900/75">{currentCaption}</p>
                </div>
              )}
            </aside>
          </div>
        </div>
      )}
    </section>
  );
}
