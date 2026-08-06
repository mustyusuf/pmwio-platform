import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getMonthlyLeaderboard } from "@/lib/leaderboard";
import { send, sendEmail, recipientsByRole, orgEmailAddress } from "@/lib/email";
import { monthlyTopReciters, monthlyTopReciterCongrats } from "@/lib/email-templates";
import { ROLES } from "@/lib/roles";

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (d: Date) => d.toLocaleString("en-GB", { month: "long", year: "numeric" });

/**
 * If a calendar month has finished since the last send, emails the Qur'an
 * Challenge recap for it: a broadcast (bcc) to all members listing the top
 * 10, plus an individual congratulations email to each of those 10. Safe to
 * call repeatedly — guarded by Settings.lastLeaderboardEmailMonth so a given
 * month is only ever sent once.
 */
export async function checkMonthlyLeaderboardEmail() {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = monthKey(lastMonthStart);

  const settings = await getSettings();
  if (settings.lastLeaderboardEmailMonth === lastMonthKey) return;

  const top10 = await getMonthlyLeaderboard(lastMonthStart, thisMonthStart, 10);
  if (top10.length > 0) {
    const label = monthLabel(lastMonthStart);

    const memberEmails = await recipientsByRole([ROLES.MEMBER]);
    if (memberEmails.length > 0) {
      await sendEmail({
        to: orgEmailAddress(),
        bcc: memberEmails,
        ...monthlyTopReciters(label, top10.map((m) => ({ rank: m.rank, name: m.name, count: m.count }))),
      });
    }

    for (const m of top10) {
      const winner = await prisma.user.findUnique({ where: { id: m.memberId }, select: { email: true, name: true } });
      if (!winner) continue;
      await send(winner.email, monthlyTopReciterCongrats(winner.name, label, m.rank, m.count));
    }
  }

  await prisma.settings.update({ where: { id: "singleton" }, data: { lastLeaderboardEmailMonth: lastMonthKey } });
}
