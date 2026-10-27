"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, Mail, MessageCircle, RefreshCw, X } from "lucide-react";
import { sendMemberResetLink, setMemberPassword, type AdminPasswordResult } from "@/app/actions/admin-passwords";

const input =
  "w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

// Unambiguous characters only (no 0/O, 1/l/I) so it's easy to read out or type.
function generatePassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

// WhatsApp wants the number in international form with no "+": turn a
// Nigerian "0803…" into "234803…". Returns null when there's nothing usable.
function whatsappNumber(phone: string | null) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

type SentDetails = { name: string; userId: string; phone: string | null; loginUrl: string; password: string };

function credentialsMessage(d: SentDetails) {
  return [
    `Assalamu alaikum ${d.name.split(" ")[0]},`,
    "",
    "Here are your PMWIO login details:",
    `User ID: ${d.userId}`,
    `Password: ${d.password}`,
    `Log in: ${d.loginUrl}`,
    "",
    "Please change your password from your profile after you log in.",
  ].join("\n");
}

export function ManagePasswordButton({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [emailIt, setEmailIt] = useState(false);
  const [result, setResult] = useState<AdminPasswordResult | null>(null);
  const [sent, setSent] = useState<SentDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && !pending && closeDialog();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open, pending]);

  function closeDialog() {
    setOpen(false);
    setPassword("");
    setVisible(false);
    setEmailIt(false);
    setResult(null);
    setSent(null);
    setCopied(false);
  }

  function setNewPassword() {
    const chosen = password;
    setResult(null);
    setSent(null);
    startTransition(async () => {
      const r = await setMemberPassword(userId, chosen, { emailPassword: emailIt });
      setResult(r);
      if (r.ok && r.account) {
        setSent({ ...r.account, password: chosen });
        setPassword("");
        setVisible(false);
      }
    });
  }

  function sendLink() {
    setResult(null);
    setSent(null);
    startTransition(async () => setResult(await sendMemberResetLink(userId)));
  }

  async function copyMessage(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (e.g. on non-HTTPS); the text stays selectable in the box.
    }
  }

  const message = sent ? credentialsMessage(sent) : "";
  const waNumber = sent ? whatsappNumber(sent.phone) : null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900">
        <KeyRound className="h-3.5 w-3.5" aria-hidden /> Password
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.currentTarget === e.target && !pending && closeDialog()}>
          <div role="dialog" aria-modal="true" aria-labelledby={`pw-title-${userId}`} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-brand-100 bg-white p-6 text-left shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id={`pw-title-${userId}`} className="text-lg font-bold text-brand-950">Password for {name}</h2>
                <p className="mt-1 text-sm text-brand-900/60">Set a new password and send it to them, or email them a link to choose their own.</p>
              </div>
              <button type="button" onClick={closeDialog} aria-label="Close" className="rounded-lg p-1 text-brand-900/50 hover:bg-brand-50"><X className="h-5 w-5" aria-hidden /></button>
            </div>

            {result && (
              <div className={`mt-4 rounded-lg px-3 py-2 text-sm font-medium ${result.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
                {result.ok ? result.message : result.error}
                {result.ok && result.resetUrl && (
                  <input readOnly value={result.resetUrl} onFocus={(e) => e.currentTarget.select()} className={`${input} mt-2 font-mono text-xs`} aria-label="Reset link" />
                )}
              </div>
            )}

            {sent && (
              <div className="mt-4 space-y-3 rounded-xl border border-brand-100 bg-brand-50/60 p-4">
                <p className="text-sm font-semibold text-brand-900">Send this to {sent.name.split(" ")[0]}</p>
                <textarea readOnly value={message} rows={8} onFocus={(e) => e.currentTarget.select()} aria-label="Message to send" className={`${input} font-mono text-xs`} />
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => copyMessage(message)} className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800">
                    {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} {copied ? "Copied" : "Copy message"}
                  </button>
                  <a
                    href={`https://wa.me/${waNumber ?? ""}?text=${encodeURIComponent(message)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden /> {waNumber ? "Send on WhatsApp" : "Open WhatsApp"}
                  </a>
                </div>
                <p className="text-xs text-brand-900/55">
                  {waNumber ? `Opens a chat with ${sent.phone}.` : "No usable phone number is on file, so WhatsApp will ask you to choose the contact."} This password won&apos;t be shown again once you close this window.
                </p>
              </div>
            )}

            <section className="mt-5">
              <h3 className="text-sm font-semibold text-brand-900">Set a new password</h3>
              <div className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={visible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    aria-label="New password"
                    className={`${input} pr-10`}
                  />
                  <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-900/50 hover:text-brand-900">
                    {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                  </button>
                </div>
                <button type="button" onClick={() => { setPassword(generatePassword()); setVisible(true); }} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                  <RefreshCw className="h-4 w-4" aria-hidden /> Generate
                </button>
              </div>
              <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-brand-900/70">
                <input type="checkbox" checked={emailIt} onChange={(e) => setEmailIt(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-700" />
                <span>Also email the User ID and new password to {name.split(" ")[0]}. Leave this off if their emails aren&apos;t arriving. They are always told by email that an administrator changed it, but without the password.</span>
              </label>
              <button
                type="button"
                disabled={pending || password.length < 8}
                onClick={setNewPassword}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4" aria-hidden /> {pending ? "Saving…" : "Set password"}
              </button>
            </section>

            <hr className="my-5 border-brand-100" />

            <section>
              <h3 className="text-sm font-semibold text-brand-900">Send a reset link</h3>
              <p className="mt-1 text-xs text-brand-900/50">Emails them a link, valid for 30 minutes, to choose a new password themselves. You never see their password.</p>
              <button
                type="button"
                disabled={pending}
                onClick={sendLink}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-50 disabled:opacity-50"
              >
                <Mail className="h-4 w-4" aria-hidden /> {pending ? "Sending…" : "Send reset link"}
              </button>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
