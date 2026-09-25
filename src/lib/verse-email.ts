import { prisma } from "@/lib/db";
import { sendEmail, orgEmailAddress } from "@/lib/email";
import { weeklyVerseReminder } from "@/lib/email-templates";
import { ROLES } from "@/lib/roles";
import { isSameLagosDay, lagosDaysBetween } from "@/lib/timezone";

// Days after weekOf (its Monday) on which a reminder is due, for members who
// still haven't submitted — a gentle nudge, a midweek check-in, and a last
// chance before the week closes. Index in this array doubles as the
// Verse.reminderCount value that's "due" for that offset.
const REMINDER_DAY_OFFSETS = [2, 4, 6];

/**
 * Nudges members who haven't yet submitted a recitation for the current
 * week's verse — up to REMINDER_DAY_OFFSETS.length times over the week, at
 * most one per Africa/Lagos calendar day. Only called from the 6am scheduler
 * tick. Self-healing: if the process is down on a reminder's exact day, the
 * overdue reminder still goes out the next time this runs (it compares
 * elapsed days, not the exact offset), and Verse.reminderCount /
 * lastReminderSentAt guard against duplicates either way.
 */
export async function checkAndSendReminders(): Promise<void> {
  const verse = await prisma.verse.findFirst({
    where: { publishedAt: { not: null }, weekOf: { lte: new Date() } },
    orderBy: { weekOf: "desc" },
  });
  if (!verse) return;
  if (verse.reminderCount >= REMINDER_DAY_OFFSETS.length) return;
  if (verse.lastReminderSentAt && isSameLagosDay(verse.lastReminderSentAt)) return;

  const daysIn = lagosDaysBetween(verse.weekOf);
  if (daysIn < REMINDER_DAY_OFFSETS[verse.reminderCount]) return;

  const pending = await prisma.user.findMany({
    where: { role: ROLES.MEMBER, active: true, recitations: { none: { verseId: verse.id } } },
    select: { email: true },
  });
  if (pending.length > 0) {
    await sendEmail({
      to: orgEmailAddress(),
      bcc: pending.map((u) => u.email),
      ...weeklyVerseReminder(verse.reference),
    });
  }
  await prisma.verse.update({
    where: { id: verse.id },
    data: { reminderCount: { increment: 1 }, lastReminderSentAt: new Date() },
  });
}
