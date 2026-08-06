"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { CATEGORY_LABEL, type ArchiveItemDTO } from "@/lib/archive-constants";

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export function ArchiveSection({ items }: { items: ArchiveItemDTO[] }) {
  const [active, setActive] = useState("ALL");

  const present = new Set(items.map((i) => i.category));
  const tabs = [{ key: "ALL", label: "All" }, ...Object.entries(CATEGORY_LABEL).filter(([key]) => present.has(key)).map(([key, label]) => ({ key, label }))];
  const shown = active === "ALL" ? items : items.filter((i) => i.category === active);

  return (
    <section className="py-4">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {tabs.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2">
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

        {shown.length === 0 ? (
          <p className="mt-10 text-center text-sm text-brand-900/50">Nothing in this category yet.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
                {item.mediaType === "AUDIO_FILE" ? (
                  <div className="bg-brand-50 p-4">
                    <audio controls src={item.audioSrc ?? undefined} className="w-full" />
                  </div>
                ) : item.embedUrl ? (
                  <iframe src={item.embedUrl} className="aspect-video w-full" allow="autoplay; fullscreen" />
                ) : (
                  <div className="grid aspect-video place-items-center bg-brand-50">
                    <a
                      href={item.url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
                    >
                      {item.mediaType === "AUDIO_LINK" ? "Listen" : "Watch"} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  </div>
                )}
                <div className="p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">{CATEGORY_LABEL[item.category] ?? item.category}</span>
                  <h3 className="mt-1 font-bold text-brand-950">{item.title}</h3>
                  {formatDate(item.eventDate) && <p className="mt-0.5 text-xs text-brand-900/50">{formatDate(item.eventDate)}</p>}
                  {item.description && <p className="mt-2 text-sm text-brand-900/70">{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
