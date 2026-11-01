import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getMonthlyLeaderboard } from "@/lib/leaderboard";
import { sendTrackedBulk, sendTrackedIndividual } from "@/lib/email-tracking";
import { monthlyTopReciters, monthlyTopReciterCongrats } from "@/lib/email-templates";
import { ROLES } from "@/lib/roles";

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (d: Date) => d.toLocaleString("en-GB", { month: "long", year: "numeric" });

/**
 * Emails the Qur'an Challenge recap for the given month range [start, end):
 * a broadcast (bcc) to all members listing the top 10, plus an individual
 * congratulations email to each of those 10. Returns the number of members
 * in the top 10 (0 means there was nothing to report, so nothing was sent).
 * Each send is best-effort (see src/lib/email.ts) — a missing/broken SMTP
 * config fails silently rather than throwing, same as every other email in
 * the app.
 */
export async function sendMonthlyRecap(start: Date, end: Date, triggeredById?: string): Promise<number> {
  const top10 = await getMonthlyLeaderboard(start, end, 10);
  if (top10.length === 0) return 0;

  const label = monthLabel(start);
  const members = await prisma.user.findMany({ where: { active: true, role: ROLES.MEMBER }, select: { email: true, name: true } });
  await sendTrackedBulk({
    kind: "MONTHLY_RECAP",
    label,
    triggeredById,
    mail: monthlyTopReciters(label, top10.map((m) => ({ rank: m.rank, name: m.name, count: m.count }))),
    recipients: members,
  });

  const winners = await prisma.user.findMany({
    where: { id: { in: top10.map((m) => m.memberId) } },
    select: { id: true, email: true, name: true },
  });
  const byId = new Map(winners.map((w) => [w.id, w]));
  await sendTrackedIndividual({
    kind: "MONTHLY_CONGRATS",
    label,
    subject: `Congratulations — you're in ${label}'s top 10`,
    triggeredById,
    items: top10.flatMap((m) => {
      const winner = byId.get(m.memberId);
      return winner ? [{ recipient: winner, mail: monthlyTopReciterCongrats(winner.name, label, m.rank, m.count) }] : [];
    }),
  });

  return top10.length;
}

/**
 * If a calendar month has finished since the last send, emails its recap.
 * Safe to call repeatedly — guarded by Settings.lastLeaderboardEmailMonth so
 * a given month is only ever auto-sent once (even if sendMonthlyRecap found
 * nothing to report, e.g. no recitations that month).
 */
export async function checkMonthlyLeaderboardEmail() {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = monthKey(lastMonthStart);

  const settings = await getSettings();
  if (settings.lastLeaderboardEmailMonth === lastMonthKey) return;

  await sendMonthlyRecap(lastMonthStart, thisMonthStart);
  await prisma.settings.update({ where: { id: "singleton" }, data: { lastLeaderboardEmailMonth: lastMonthKey } });
}
