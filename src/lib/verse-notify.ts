import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/roles";
import { sendEmail, recipientsByRole, orgEmailAddress } from "@/lib/email";
import { weeklyVerseLive } from "@/lib/email-templates";

/**
 * Tells every active member (in-app notification + bcc email) that the
 * week's verse is open for recitation. A verse counts as live once it is
 * published AND its weekOf has arrived — admins schedule verses ahead, so
 * this runs both right after publishing (for a verse whose week has already
 * begun) and hourly from the scheduler (for scheduled ones). Guarded by
 * Verse.notifiedAt so each verse is announced at most once. Returns the
 * reference announced, or null if nothing was due.
 */
export async function notifyMembersOfLiveVerse(): Promise<string | null> {
  const now = new Date();
  const due = await prisma.verse.findMany({
    where: { publishedAt: { not: null }, weekOf: { lte: now }, notifiedAt: null },
    orderBy: { weekOf: "desc" },
    select: { id: true, reference: true, translation: true },
  });
  if (due.length === 0) return null;

  // Only the newest one is "this week's verse" (see /dashboard/quran). Any
  // older unannounced verses were superseded — stamp them so they never fire.
  const [live, ...stale] = due;
  await prisma.verse.updateMany({ where: { id: { in: due.map((v) => v.id) } }, data: { notifiedAt: now } });
  if (stale.length) console.info(`[quran] skipped announcing ${stale.length} superseded verse(s)`);

  const members = await prisma.user.findMany({
    where: { active: true, role: ROLES.MEMBER },
    select: { id: true },
  });
  if (members.length > 0) {
    await prisma.notification.createMany({
      data: members.map((m) => ({
        userId: m.id,
        title: "This week's verse is live",
        body: `${live.reference} is open for recitation. Record or upload yours before the week ends.`,
      })),
    });
  }

  // Email #35 — bcc broadcast so members don't see each other's addresses.
  const emails = await recipientsByRole([ROLES.MEMBER]);
  if (emails.length > 0) {
    await sendEmail({ to: orgEmailAddress(), bcc: emails, ...weeklyVerseLive(live.reference, live.translation) });
  }
  return live.reference;
}
