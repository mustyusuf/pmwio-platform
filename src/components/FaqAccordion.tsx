"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type FaqItem = { q: string; a: string };

/** A simple single-open accordion for a list of Q&A pairs. */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mt-8 space-y-4">
      {items.map((f, i) => {
        const open = openIndex === i;
        return (
          <div key={f.q} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-brand-100">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
            >
              <h3 className="font-bold text-brand-900">{f.q}</h3>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-brand-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-brand-900/65">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
