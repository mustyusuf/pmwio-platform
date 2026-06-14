"use client";

import { useState } from "react";
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
            {shown.map((g) => (
              <figure key={g.id} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-950 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.src} alt={g.caption} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-950/80 to-transparent p-3">
                  <span className="text-xs font-semibold text-white">{g.caption}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
