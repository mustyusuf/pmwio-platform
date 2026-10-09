import { z } from "zod";
import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/roles";
import { isEmailConfigured, orgEmailAddress, send, sendEmail } from "@/lib/email";
import { broadcastMessage } from "@/lib/email-templates";

/** Every user category an admin can address, in the order shown on the page. */
export const AUDIENCE_ROLES = [
  ROLES.MEMBER,
  ROLES.BENEFICIARY,
  ROLES.COORDINATOR,
  ROLES.FINANCE,
  ROLES.BOARD,
  ROLES.EXECUTIVE,
  ROLES.ADMIN,
] as const;

export const broadcastSchema = z
  .object({
    subject: z.string().trim().min(3, "Enter a subject.").max(150, "Keep the subject under 150 characters."),
    message: z.string().trim().min(10, "Write your message.").max(5000, "Keep the message under 5,000 characters."),
    ctaLabel: z.string().trim().max(40, "Keep the button label under 40 characters.").optional(),
    ctaUrl: z.string().trim().max(500).optional(),
    roles: z
      .array(z.string())
      .min(1, "Choose at least one recipient group.")
      .refine((roles) => roles.every((r) => (AUDIENCE_ROLES as readonly string[]).includes(r)), "Unknown recipient group."),
  })
  .superRefine((v, ctx) => {
    const hasLabel = Boolean(v.ctaLabel);
    const hasUrl = Boolean(v.ctaUrl);
    if (hasLabel !== hasUrl) {
      ctx.addIssue({ code: "custom", path: ["ctaUrl"], message: "A button needs both a label and a link — or leave both empty." });
    }
    if (hasUrl && !/^https?:\/\/\S+$/i.test(v.ctaUrl!)) {
      ctx.addIssue({ code: "custom", path: ["ctaUrl"], message: "The button link must start with http:// or https://." });
    }
  });

export type BroadcastInput = z.input<typeof broadcastSchema>;

/** Active, email-confirmed accounts per role — who would actually receive a broadcast. */
export async function audienceCounts(): Promise<Record<string, number>> {
  const grouped = await prisma.user.groupBy({
    by: ["role"],
    where: { active: true, emailVerified: true },
    _count: { _all: true },
  });
  return Object.fromEntries(grouped.map((g) => [g.role, g._count._all]));
}

async function recipientEmails(roles: string[]) {
  const users = await prisma.user.findMany({
    where: { active: true, emailVerified: true, role: { in: roles } },
    select: { email: true },
  });
  return [...new Set(users.map((u) => u.email.trim().toLowerCase()).filter(Boolean))];
}

export function buildBroadcastMail(input: { subject: string; message: string; ctaLabel?: string; ctaUrl?: string }) {
  return broadcastMessage({
    subject: input.subject,
    message: input.message,
    ctaLabel: input.ctaLabel || undefined,
    ctaUrl: input.ctaUrl || undefined,
  });
}

/** Sends the message to the admin alone, so they can see it in a real inbox first. */
export async function sendBroadcastTest(input: z.output<typeof broadcastSchema>, to: string) {
  if (!isEmailConfigured()) return { ok: false as const, error: "Email isn't set up on this server (SMTP settings are missing), so nothing can be sent." };
  const mail = buildBroadcastMail(input);
  const ok = await send(to, { ...mail, subject: `[Test] ${mail.subject}` });
  return ok ? { ok: true as const } : { ok: false as const, error: "The mail server rejected the test email. Check the SMTP settings." };
}

/** Emails the broadcast to everyone in the chosen groups (bcc, so addresses stay private) and records it. */
export async function deliverBroadcast(input: z.output<typeof broadcastSchema>, sender: { id: string; name: string }) {
  if (!isEmailConfigured()) {
    return { ok: false as const, error: "Email isn't set up on this server (SMTP settings are missing), so nothing was sent." };
  }
  const emails = await recipientEmails(input.roles);
  if (emails.length === 0) return { ok: false as const, error: "There are no active, email-confirmed users in the chosen groups." };

  const delivered = await sendEmail({ to: orgEmailAddress(), bcc: emails, ...buildBroadcastMail(input) });

  await prisma.broadcast.create({
    data: {
      subject: input.subject,
      message: input.message,
      ctaLabel: input.ctaLabel || null,
      ctaUrl: input.ctaUrl || null,
      audience: input.roles.join(","),
      recipientCount: emails.length,
      delivered,
      sentById: sender.id,
    },
  });
  await prisma.activityLog.create({
    data: {
      userId: sender.id,
      action: "BROADCAST_SENT",
      detail: `"${input.subject}" to ${input.roles.join(", ")} (${emails.length} recipient${emails.length === 1 ? "" : "s"})${delivered ? "" : " — some batches failed"}`,
    },
  });

  return { ok: true as const, count: emails.length, delivered };
}
