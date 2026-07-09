
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/paystack";

// ---------------------------------------------------------------------------
// Transactional email (Resend) for Pious Muslim Women International Organization.
//
// Every email is best-effort: a failed or unconfigured send must NEVER break
// the user action that triggered it. sendEmail() therefore swallows all errors
// (logging them) and returns quietly when RESEND_API_KEY is not set.
// ---------------------------------------------------------------------------

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// A verified sender on the organization's Resend domain. Override with EMAIL_FROM
// (e.g. to fall back to Resend's shared "onboarding@resend.dev" before the domain
// has finished DNS verification).
const EMAIL_FROM = process.env.EMAIL_FROM ?? "PMWIO <noreply@piousmuslimwomen.org.ng>";
const REPLY_TO = process.env.EMAIL_REPLY_TO;

/** Whether transactional email is configured (an API key is present). */
export function isEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}

export type Mail = { subject: string; html: string; text: string };

type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

/** Send one email via Resend. Never throws. */
export async function sendEmail({ to, subject, html, text, replyTo }: SendArgs): Promise<boolean> {
  const recipients = (Array.isArray(to) ? to : [to])
    .map((r) => r?.trim())
    .filter((r): r is string => Boolean(r));
  if (recipients.length === 0) return false;

  if (!RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not set — skipping "${subject}" to ${recipients.join(", ")}`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: recipients,
        subject,
        html,
        text,
        ...(replyTo ?? REPLY_TO ? { reply_to: replyTo ?? REPLY_TO } : {}),
      }),
    });
    if (!res.ok) {
      console.error(`[email] send failed (${res.status}): ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send threw:", err);
    return false;
  }
}

/** Convenience: send a prepared template to one or more addresses. */
export function send(to: string | string[], mail: Mail, replyTo?: string) {
  return sendEmail({ to, ...mail, replyTo });
}

/** Active users' email addresses for the given roles (for broadcast alerts). */
export async function recipientsByRole(roles: string[]): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { active: true, role: { in: roles } },
    select: { email: true },
  });
  return users.map((u) => u.email).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Branded HTML layout
// ---------------------------------------------------------------------------

const BRAND = "#1A6B3A"; // PMWIO green
const ORG = "Pious Muslim Women International Organization";
const ORG_SHORT = "PMWIO";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type LayoutOptions = {
  /** Email subject line. Defaults to `heading` when omitted. */
  subject?: string;
  heading: string;
  intro?: string;
  /** Body paragraphs (plain text; rendered as <p>). */
  body: string[];
  cta?: { label: string; url: string };
  /** Key/value facts shown in a boxed panel (e.g. User ID, reference). */
  facts?: { label: string; value: string }[];
  footnote?: string;
};

/**
 * Renders a branded, email-client-safe HTML message plus a plain-text version.
 * Uses inline styles and table-free layout for broad compatibility.
 */
export function layout(opts: LayoutOptions): Mail {
  const link = appUrl();

  const factsHtml = opts.facts?.length
    ? `<div style="margin:20px 0;padding:16px 18px;background:#f5f7f4;border:1px solid #e3e8e0;border-radius:8px;">
        ${opts.facts
          .map(
            (f) =>
              `<div style="font-size:14px;line-height:1.6;color:#333;"><span style="color:#6b7280;">${escapeHtml(
                f.label,
              )}:</span> <strong style="color:#111;">${escapeHtml(f.value)}</strong></div>`,
          )
          .join("")}
      </div>`
    : "";

  const ctaHtml = opts.cta
    ? `<div style="margin:28px 0;">
        <a href="${escapeHtml(opts.cta.url)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 26px;border-radius:8px;">${escapeHtml(
          opts.cta.label,
        )}</a>
      </div>`
    : "";

  const bodyHtml = opts.body
    .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#333;">${p}</p>`)
    .join("");

  const introHtml = opts.intro
    ? `<p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#111;">${escapeHtml(opts.intro)}</p>`
    : "";

  const html = `<div style="margin:0;padding:24px 12px;background:#eef1ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e3e8e0;">
    <div style="background:${BRAND};padding:22px 28px;">
      <div style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.2px;">${ORG_SHORT}</div>
      <div style="color:#cfe3d6;font-size:12px;margin-top:2px;">${ORG}</div>
    </div>
    <div style="padding:28px;">
      <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#111;">${escapeHtml(opts.heading)}</h1>
      ${introHtml}
      ${bodyHtml}
      ${factsHtml}
      ${ctaHtml}
      ${opts.footnote ? `<p style="margin:22px 0 0;font-size:12.5px;line-height:1.6;color:#6b7280;">${opts.footnote}</p>` : ""}
    </div>
    <div style="padding:18px 28px;background:#f5f7f4;border-top:1px solid #e3e8e0;">
      <p style="margin:0;font-size:12px;line-height:1.6;color:#8a938c;">
        This is an automated message from ${ORG}.<br/>
        <a href="${link}" style="color:${BRAND};text-decoration:none;">${link.replace(/^https?:\/\//, "")}</a>
      </p>
    </div>
  </div>
</div>`;

  // Plain-text fallback.
  const textParts: string[] = [opts.heading, ""];
  if (opts.intro) textParts.push(opts.intro, "");
  for (const p of opts.body) textParts.push(stripTags(p));
  if (opts.facts?.length) {
    textParts.push("");
    for (const f of opts.facts) textParts.push(`${f.label}: ${f.value}`);
  }
  if (opts.cta) textParts.push("", `${opts.cta.label}: ${opts.cta.url}`);
  if (opts.footnote) textParts.push("", stripTags(opts.footnote));
  textParts.push("", `— ${ORG}`, link);

  return { subject: opts.subject ?? opts.heading, html, text: textParts.join("\n") };
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
}

/** Absolute URL for a path within the app (used in CTA links). */
export function link(path: string): string {
  return `${appUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
