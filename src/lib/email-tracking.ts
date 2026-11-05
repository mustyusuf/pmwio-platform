import { prisma } from "@/lib/db";
import { dispatchEmail, orgEmailAddress, type DeliveryOutcome, type Mail } from "@/lib/email";

// ---------------------------------------------------------------------------
// Delivery log. Every member-facing blast that admins may need to follow up on
// (verse announcements, the monthly top-10 recap, broadcasts) is sent through
// here so each recipient's result is recorded and failures can be retried.
//
// "Sent" means the mail server accepted the message for that address. A later
// bounce or a spam-folder landing happens after that and isn't visible to us.
// ---------------------------------------------------------------------------

export type CampaignKind = "VERSE_LIVE" | "VERSE_REMINDER" | "MONTHLY_RECAP" | "MONTHLY_CONGRATS" | "BROADCAST";

export const CAMPAIGN_KIND_LABEL: Record<string, string> = {
  VERSE_LIVE: "Weekly verse announcement",
  VERSE_REMINDER: "Weekly verse reminder",
  MONTHLY_RECAP: "Monthly top 10 (all members)",
  MONTHLY_CONGRATS: "Top 10 congratulations",
  BROADCAST: "Broadcast",
};

export type Recipient = { email: string; name?: string | null };

type CampaignMeta = { kind: CampaignKind; label: string; refId?: string; triggeredById?: string | null };

export type CampaignSummary = { id: string; total: number; sent: number; failed: number };

function dedupe(recipients: Recipient[]) {
  const seen = new Map<string, Recipient>();
  for (const r of recipients) {
    const email = r.email?.trim().toLowerCase();
    if (email && !seen.has(email)) seen.set(email, { email, name: r.name });
  }
  return [...seen.values()];
}

const tally = (outcomes: DeliveryOutcome[]) => {
  const sent = outcomes.filter((o) => o.ok).length;
  return { sent, failed: outcomes.length - sent };
};

/** One message to many people (bcc, so addresses stay private), logged per recipient. */
export async function sendTrackedBulk(meta: CampaignMeta & { mail: Mail; recipients: Recipient[] }): Promise<CampaignSummary | null> {
  const recipients = dedupe(meta.recipients);
  if (recipients.length === 0) return null;

  const { outcomes } = await dispatchEmail({ to: orgEmailAddress(), bcc: recipients.map((r) => r.email), ...meta.mail });
  const results = recipients.map((r) => outcomes.get(r.email) ?? { ok: false, error: "No result from the mail server." });
  const counts = tally(results);

  const campaign = await prisma.emailCampaign.create({
    data: {
      kind: meta.kind,
      label: meta.label,
      refId: meta.refId,
      subject: meta.mail.subject,
      html: meta.mail.html,
      text: meta.mail.text,
      total: recipients.length,
      ...counts,
      triggeredById: meta.triggeredById ?? null,
      deliveries: {
        create: recipients.map((r, i) => ({
          email: r.email,
          name: r.name ?? null,
          status: results[i].ok ? "SENT" : "FAILED",
          error: results[i].ok ? null : results[i].error ?? "Unknown error",
        })),
      },
    },
  });
  return { id: campaign.id, total: recipients.length, ...counts };
}

/** A different email per person (e.g. congratulations), logged per recipient. */
export async function sendTrackedIndividual(
  meta: CampaignMeta & { subject: string; items: { recipient: Recipient; mail: Mail }[] },
): Promise<CampaignSummary | null> {
  if (meta.items.length === 0) return null;

  const rows: { email: string; name: string | null; outcome: DeliveryOutcome; mail: Mail }[] = [];
  for (const { recipient, mail } of meta.items) {
    const email = recipient.email.trim().toLowerCase();
    if (!email) continue;
    const { outcomes } = await dispatchEmail({ to: email, ...mail });
    rows.push({ email, name: recipient.name ?? null, outcome: outcomes.get(email) ?? { ok: false, error: "No result from the mail server." }, mail });
  }
  if (rows.length === 0) return null;
  const counts = tally(rows.map((r) => r.outcome));

  const campaign = await prisma.emailCampaign.create({
    data: {
      kind: meta.kind,
      label: meta.label,
      refId: meta.refId,
      subject: meta.subject,
      html: "",
      text: "",
      total: rows.length,
      ...counts,
      triggeredById: meta.triggeredById ?? null,
      deliveries: {
        create: rows.map((r) => ({
          email: r.email,
          name: r.name,
          status: r.outcome.ok ? "SENT" : "FAILED",
          error: r.outcome.ok ? null : r.outcome.error ?? "Unknown error",
          payload: JSON.stringify(r.mail),
        })),
      },
    },
  });
  return { id: campaign.id, total: rows.length, ...counts };
}

/** Tries again for every recipient of a campaign whose email failed. */
export async function retryFailedDeliveries(
  campaignId: string,
  /** For automatic retries: skip recipients already tried this many times or tried too recently. */
  limits?: { maxAttempts: number; notTriedSince: Date },
): Promise<{ retried: number; sent: number } | null> {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
    include: {
      deliveries: {
        where: {
          status: "FAILED",
          ...(limits ? { attempts: { lt: limits.maxAttempts }, updatedAt: { lt: limits.notTriedSince } } : {}),
        },
      },
    },
  });
  if (!campaign) return null;
  const failed = campaign.deliveries;
  if (failed.length === 0) return { retried: 0, sent: 0 };

  const outcomes = new Map<string, DeliveryOutcome>();
  const personal = failed.filter((d) => d.payload);
  const shared = failed.filter((d) => !d.payload);

  if (shared.length > 0) {
    const mail = { subject: campaign.subject, html: campaign.html, text: campaign.text };
    const result = await dispatchEmail({ to: orgEmailAddress(), bcc: shared.map((d) => d.email), ...mail });
    result.outcomes.forEach((outcome, email) => outcomes.set(email, outcome));
  }
  for (const d of personal) {
    const mail = JSON.parse(d.payload!) as Mail;
    const result = await dispatchEmail({ to: d.email, ...mail });
    outcomes.set(d.email, result.outcomes.get(d.email) ?? { ok: false, error: "No result from the mail server." });
  }

  for (const d of failed) {
    const outcome = outcomes.get(d.email) ?? { ok: false, error: "No result from the mail server." };
    await prisma.emailDelivery.update({
      where: { id: d.id },
      data: { status: outcome.ok ? "SENT" : "FAILED", error: outcome.ok ? null : outcome.error ?? "Unknown error", attempts: { increment: 1 } },
    });
  }
  const [sent, failedNow] = await Promise.all([
    prisma.emailDelivery.count({ where: { campaignId, status: "SENT" } }),
    prisma.emailDelivery.count({ where: { campaignId, status: "FAILED" } }),
  ]);
  await prisma.emailCampaign.update({ where: { id: campaignId }, data: { sent, failed: failedNow } });
  return { retried: failed.length, sent: failed.filter((d) => outcomes.get(d.email)?.ok).length };
}

const AUTO_RETRY_KINDS = ["VERSE_LIVE", "VERSE_REMINDER"];
const AUTO_RETRY_MAX_ATTEMPTS = 3; // the first send counts as attempt 1
const AUTO_RETRY_MIN_GAP_MS = 30 * 60 * 1000;
const AUTO_RETRY_WINDOW_MS = 24 * 3600 * 1000;

/**
 * Re-sends the member-facing Qur'an emails to anyone they failed for (a mail
 * host that was briefly down or over its hourly limit), so a hiccup doesn't
 * silently cost members their announcement or reminder. Each recipient gets
 * a couple of tries, spaced out, within a day of the original send; after
 * that an admin can still retry from the Email Delivery page.
 */
export async function retryRecentFailures() {
  const campaigns = await prisma.emailCampaign.findMany({
    where: {
      kind: { in: AUTO_RETRY_KINDS },
      failed: { gt: 0 },
      createdAt: { gt: new Date(Date.now() - AUTO_RETRY_WINDOW_MS) },
    },
    select: { id: true },
  });
  for (const { id } of campaigns) {
    await retryFailedDeliveries(id, { maxAttempts: AUTO_RETRY_MAX_ATTEMPTS, notTriedSince: new Date(Date.now() - AUTO_RETRY_MIN_GAP_MS) });
  }
}
