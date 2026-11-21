import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/roles";
import { isEmailConfigured } from "@/lib/email";
import { sendTrackedBulk } from "@/lib/email-tracking";
import { weeklyVerseLive } from "@/lib/email-templates";

/**
 * Emails every active member that a verse is open for recitation (#35),
 * recording each recipient's result in the delivery log. Used by the
 * automatic announcement and by the admin's manual "Email members" button.
 */
export async function emailVerseToMembers(verse: { id: string; reference: string; translation: string }, triggeredById?: string) {
  const members = await prisma.user.findMany({
    where: { active: true, role: ROLES.MEMBER },
    select: { email: true, name: true },
  });
  return sendTrackedBulk({
    kind: "VERSE_LIVE",
    label: verse.reference,
    refId: verse.id,
    triggeredById,
    mail: weeklyVerseLive(verse.reference, verse.translation),
    recipients: members,
  });
}

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

  // Without a working mail setup the announcement would be marked as sent
  // without anyone receiving it. Hold it instead; the scheduler tries again
  // every few minutes and it goes out as soon as email is configured.
  if (!isEmailConfigured()) {
    console.warn(`[quran] holding the announcement for "${due[0].reference}" — SMTP isn't configured`);
    return null;
  }

  // Only the newest one is "this week's verse" (see /dashboard/quran). Any
  // older unannounced verses were superseded — stamp them so they never fire.
  const [live, ...stale] = due;
  const ids = due.map((v) => v.id);
  // Claim atomically so overlapping runs (a tick and a publish click) can't both announce.
  const claimed = await prisma.verse.updateMany({ where: { id: { in: ids }, notifiedAt: null }, data: { notifiedAt: now } });
  if (claimed.count === 0) return null;
  if (stale.length) console.info(`[quran] skipped announcing ${stale.length} superseded verse(s)`);

  try {
    await announce(live);
  } catch (error) {
    // Something broke before the announcement finished (e.g. the database):
    // un-claim it so the next tick tries again rather than losing it.
    await prisma.verse.updateMany({ where: { id: { in: ids } }, data: { notifiedAt: null } });
    throw error;
  }
  return live.reference;
}

async function announce(live: { id: string; reference: string; translation: string }) {
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
  await emailVerseToMembers(live);
}
