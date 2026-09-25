"use client";

import { useEffect, useState } from "react";

function lagosTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
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

/** Live Nigeria-time clock for the header. Renders nothing until mounted, so the server-rendered page never shows a stale or mismatched time. */
export function LiveClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(lagosTime(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <NigeriaFlag />
      <span>{time} WAT</span>
    </span>
  );
}
