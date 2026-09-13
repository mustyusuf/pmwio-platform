
import nodemailer, { type Transporter } from "nodemailer";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/paystack";

// ---------------------------------------------------------------------------
// Transactional email over SMTP (the organization's cPanel mailbox) for Pious
// Muslim Women International Organization.
//
// Every email is best-effort: a failed or unconfigured send must NEVER break
// the user action that triggered it. sendEmail() therefore swallows all errors
// (logging them) and returns quietly when SMTP is not configured.
// ---------------------------------------------------------------------------

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 465);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
// Implicit TLS on 465 (cPanel's recommended setting); STARTTLS otherwise.
const SMTP_SECURE = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : SMTP_PORT === 465;
// The From header. Shared hosts reject mail whose From address doesn't belong
// to the authenticated mailbox, so this should be SMTP_USER (or an alias of it).
const EMAIL_FROM = process.env.EMAIL_FROM ?? (SMTP_USER ? `PMWIO <${SMTP_USER}>` : "PMWIO <noreply@piousmuslimwomen.org.ng>");
const REPLY_TO = process.env.EMAIL_REPLY_TO;
// Broadcasts (bcc) go out in batches this size — shared hosts cap recipients
// per message, and a single rejected batch shouldn't take the whole send down.
const BCC_BATCH_SIZE = Math.max(1, Number(process.env.EMAIL_BCC_BATCH_SIZE ?? 50));

/** Whether transactional email is configured (SMTP credentials are present). */
export function isEmailConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

/** The bare sending address (e.g. "admin@piousmuslimwomen.org.ng"), for use as `to` on a bcc-only broadcast. */
export function orgEmailAddress(): string {
  return EMAIL_FROM.match(/<(.+)>/)?.[1] ?? EMAIL_FROM;
}

// One pooled connection per process: broadcasts send many messages back to
// back, and re-handshaking TLS for each is what makes SMTP slow.
const globalForMail = globalThis as unknown as { smtpTransport?: Transporter };
function transport(): Transporter {
  if (!globalForMail.smtpTransport) {
    globalForMail.smtpTransport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      pool: true,
      maxConnections: 2,
    });
  }
  return globalForMail.smtpTransport;
}

export type Mail = { subject: string; html: string; text: string };

type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /** Hidden recipients — e.g. a broadcast where members shouldn't see each other's addresses. */
  bcc?: string[];
};

/** Send one email over SMTP (bcc lists are split into batches). Never throws. */
export async function sendEmail({ to, subject, html, text, replyTo, bcc }: SendArgs): Promise<boolean> {
  const recipients = (Array.isArray(to) ? to : [to])
    .map((r) => r?.trim())
    .filter((r): r is string => Boolean(r));
  if (recipients.length === 0) return false;
  const bccRecipients = bcc?.map((r) => r?.trim()).filter((r): r is string => Boolean(r)) ?? [];

  if (!isEmailConfigured()) {
    console.warn(`[email] SMTP not configured — skipping "${subject}" to ${recipients.join(", ")}`);
    return false;
  }

  const batches: (string[] | undefined)[] = [];
  if (bccRecipients.length === 0) batches.push(undefined);
  for (let i = 0; i < bccRecipients.length; i += BCC_BATCH_SIZE) batches.push(bccRecipients.slice(i, i + BCC_BATCH_SIZE));

  let ok = true;
  for (const batch of batches) {
    try {
      await transport().sendMail({
        from: EMAIL_FROM,
        to: recipients,
        subject,
        html,
        text,
        ...(replyTo ?? REPLY_TO ? { replyTo: replyTo ?? REPLY_TO } : {}),
        ...(batch?.length ? { bcc: batch } : {}),
      });
    } catch (err) {
      console.error(`[email] send failed for "${subject}":`, err);
      ok = false;
    }
  }
  return ok;
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
  const logoUrl = `${link}/pmwio-logo.png`;

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
    <div style="background:#ffffff;padding:26px 28px 20px;text-align:center;border-bottom:3px solid ${BRAND};">
      <img src="${logoUrl}" alt="${ORG}" width="200" style="width:200px;max-width:72%;height:auto;display:inline-block;border:0;outline:none;text-decoration:none;" />
      <div style="margin-top:12px;color:#6b7280;font-size:12px;letter-spacing:.2px;">${ORG}</div>
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
