"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Eye, Send, TestTube2 } from "lucide-react";
import {
  previewBroadcast,
  sendBroadcastAction,
  sendBroadcastTestAction,
  type BroadcastPreview,
} from "@/app/actions/broadcast";

type Audience = { role: string; label: string; count: number };

const label = "block text-sm font-medium text-brand-900";
const input =
  "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

// Keeps links in the preview from navigating the preview frame away.
const withBlankTarget = (html: string) => `<base target="_blank">${html}`;

export function BroadcastComposer({ audiences }: { audiences: Audience[] }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [preview, setPreview] = useState<BroadcastPreview | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const frameRef = useRef<HTMLIFrameElement>(null);

  const total = audiences.filter((a) => roles.includes(a.role)).reduce((sum, a) => sum + a.count, 0);
  const selectedLabels = audiences.filter((a) => roles.includes(a.role)).map((a) => a.label);
  const content = { subject, message, ctaLabel, ctaUrl, roles };
  const canSend = subject.trim().length >= 3 && message.trim().length >= 10 && roles.length > 0 && total > 0;

  // Keep the preview in step with what's typed (debounced).
  useEffect(() => {
    if (subject.trim().length < 3 || message.trim().length < 10) {
      const reset = setTimeout(() => setPreview(null), 0);
      return () => clearTimeout(reset);
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await previewBroadcast({ subject, message, ctaLabel, ctaUrl, roles });
      if (!cancelled) setPreview(result);
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [subject, message, ctaLabel, ctaUrl, roles]);

  function toggle(role: string) {
    setConfirming(false);
    setRoles((current) => (current.includes(role) ? current.filter((r) => r !== role) : [...current, role]));
  }

  function run(action: () => Promise<{ ok: boolean; message?: string; error?: string }>, onOk?: () => void) {
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      setNotice({ ok: result.ok, text: (result.ok ? result.message : result.error) ?? "" });
      setConfirming(false);
      if (result.ok) onOk?.();
    });
  }

  function resizeFrame() {
    const doc = frameRef.current?.contentDocument;
    if (doc && frameRef.current) frameRef.current.style.height = `${doc.body.scrollHeight + 8}px`;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
      <div className="space-y-5">
        {notice && (
          <p className={`rounded-lg px-3 py-2 text-sm font-medium ${notice.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
            {notice.text}
          </p>
        )}

        <div>
          <label className={label} htmlFor="bc-subject">Subject</label>
          <input id="bc-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} className={input} placeholder="e.g. Eid Mubarak from all of us at PMWIO" />
        </div>

        <div>
          <label className={label} htmlFor="bc-message">Message</label>
          <textarea id="bc-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={9} maxLength={5000} className={input} placeholder={"Write your message here.\n\nLeave a blank line to start a new paragraph."} />
          <p className="mt-1 text-xs text-brand-900/50">Plain text. Each email opens with &quot;Assalamu alaikum,&quot;. {message.length}/5000</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="bc-cta-label">Button text (optional)</label>
            <input id="bc-cta-label" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} maxLength={40} className={input} placeholder="e.g. Read more" />
          </div>
          <div>
            <label className={label} htmlFor="bc-cta-url">Button link (optional)</label>
            <input id="bc-cta-url" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} className={input} placeholder="https://…" inputMode="url" />
          </div>
        </div>

        <fieldset>
          <legend className={label}>Send to</legend>
          <div className="mt-2 flex gap-3 text-xs font-semibold text-brand-700">
            <button type="button" onClick={() => { setConfirming(false); setRoles(audiences.map((a) => a.role)); }} className="hover:underline">Select all</button>
            <button type="button" onClick={() => { setConfirming(false); setRoles([]); }} className="hover:underline">Clear</button>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {audiences.map((a) => (
              <label key={a.role} className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition ${roles.includes(a.role) ? "border-brand-500 bg-brand-50" : "border-brand-200 hover:bg-brand-50/60"}`}>
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={roles.includes(a.role)} onChange={() => toggle(a.role)} className="h-4 w-4 accent-brand-700" />
                  {a.label}
                </span>
                <span className="text-xs font-semibold tabular-nums text-brand-900/55">{a.count}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-brand-900/50">Counts are active accounts with a confirmed email address.</p>
        </fieldset>

        {!confirming ? (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canSend || pending}
              onClick={() => run(() => sendBroadcastTestAction(content))}
              className="inline-flex items-center gap-2 rounded-lg border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-50 disabled:opacity-50"
            >
              <TestTube2 className="h-4 w-4" aria-hidden /> Send test to me
            </button>
            <button
              type="button"
              disabled={!canSend || pending}
              onClick={() => { setNotice(null); setConfirming(true); }}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden /> Send broadcast…
            </button>
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              Send &quot;{subject.trim()}&quot; to <strong>{total}</strong> {total === 1 ? "person" : "people"}?
            </p>
            <p className="text-sm text-amber-900/80">Recipients: {selectedLabels.join(", ")}. This can&apos;t be undone.</p>
            {total > 200 && (
              <p className="text-xs text-amber-900/70">Shared mail hosts often cap sending at a few hundred emails an hour, so a very large broadcast may be only partly delivered.</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => sendBroadcastAction(content), () => { setSubject(""); setMessage(""); setCtaLabel(""); setCtaUrl(""); setRoles([]); })}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
              >
                <Send className="h-4 w-4" aria-hidden /> {pending ? "Sending…" : `Yes, send to ${total}`}
              </button>
              <button type="button" disabled={pending} onClick={() => setConfirming(false)} className="rounded-lg border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="xl:sticky xl:top-24 xl:self-start">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-900">
          <Eye className="h-4 w-4 text-brand-600" aria-hidden /> Email preview
        </div>
        {preview?.ok ? (
          <div className="overflow-hidden rounded-2xl border border-brand-100 bg-brand-50/50">
            <div className="border-b border-brand-100 bg-white px-4 py-2.5 text-xs text-brand-900/60">
              <span className="font-semibold text-brand-900">Subject:</span> {preview.subject}
            </div>
            <iframe
              ref={frameRef}
              title="Email preview"
              sandbox="allow-same-origin allow-popups"
              srcDoc={withBlankTarget(preview.html)}
              onLoad={resizeFrame}
              className="block w-full border-0"
              style={{ minHeight: 320 }}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-brand-200 p-8 text-center text-sm text-brand-900/55">
            {preview && !preview.ok ? preview.error : "Add a subject and a message to see how the email will look."}
          </div>
        )}
      </div>
    </div>
  );
}
