"use client";

import { useEffect, useState } from "react";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be unavailable (e.g. non-secure context); ignore.
    }
  }

  return (
    <div>
      <span className="text-xs font-medium uppercase tracking-wider text-brand-100/70">
        {label}
      </span>
      <div className="mt-1.5 flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg bg-white/10 px-3 py-2 font-mono text-sm text-white ring-1 ring-white/15">
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export function ReferralCard({ refereeId }: { refereeId: string }) {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const shareLink = origin
    ? `${origin}/apply?ref=${refereeId}`
    : `/apply?ref=${refereeId}`;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white shadow-sm sm:p-7">
      <h2 className="text-lg font-bold">Your User ID</h2>
      <p className="mt-1 text-sm text-brand-100/80">
        This is your unique ID (also your Referee ID). Use it to log in, and
        share it so applicants can name you as their referee when they apply.
      </p>
      <div className="mt-5 space-y-4">
        <CopyField label="User ID (Referee ID)" value={refereeId} />
        <CopyField label="Your referral link" value={shareLink} />
      </div>
    </div>
  );
}
