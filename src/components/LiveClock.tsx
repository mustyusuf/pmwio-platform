"use client";

import { useEffect, useState } from "react";

function lagosDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function lagosTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date).toLowerCase();
}

// Drawn inline rather than using the 🇳🇬 emoji — flag emoji support is
// inconsistent across platforms (older Windows browsers render it as the
// literal letters "NG"), so an SVG guarantees it always looks like a flag.
function NigeriaFlag() {
  return (
    <svg viewBox="0 0 3 2" className="h-3 w-[18px] shrink-0 rounded-[1px]" aria-hidden>
      <rect width="1" height="2" fill="#008751" />
      <rect x="1" width="1" height="2" fill="#ffffff" />
      <rect x="2" width="1" height="2" fill="#008751" />
    </svg>
  );
}

/** Live Nigeria date/time for the header. Renders nothing until mounted, so the server-rendered page never shows a stale or mismatched value. */
export function LiveClock() {
  const [now, setNow] = useState<{ date: string; time: string } | null>(null);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow({ date: lagosDate(d), time: lagosTime(d) });
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  return (
    <span className="flex w-full items-center justify-between gap-3">
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <NigeriaFlag />
        <span>{now.date}</span>
      </span>
      <span className="whitespace-nowrap font-medium tabular-nums">{now.time} WAT</span>
    </span>
  );
}
