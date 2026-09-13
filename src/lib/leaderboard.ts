import { prisma } from "@/lib/db";

export type LeaderboardEntry = { memberId: string; name: string; userId: string; count: number; rank: number };

async function withMemberInfo(counts: { memberId: string; count: number }[], limit: number): Promise<LeaderboardEntry[]> {
  const top = counts.slice(0, limit);
  const users = await prisma.user.findMany({
    where: { id: { in: top.map((c) => c.memberId) } },
    select: { id: true, name: true, userId: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));
  return top.map((c, i) => {
    const u = byId.get(c.memberId);
    return { memberId: c.memberId, name: u?.name ?? "Unknown", userId: u?.userId ?? "", count: c.count, rank: i + 1 };
  });
}

type Ranked = { memberId: string; count: number; reachedAt: Date };

/**
 * Highest count first; ties go to whoever reached that count first (the
 * time of their latest counted submission). Without a deterministic
 * tie-break, equal-count members would sit in whatever order the database
 * returned them — which reshuffles as new rows are inserted.
 */
function byRank(a: Ranked, b: Ranked) {
  return b.count - a.count || a.reachedAt.getTime() - b.reachedAt.getTime();
}

/** A member's 1-based position in a full (unsliced) ranking, or null if absent. */
export function rankOf(memberId: string, counts: { memberId: string }[]): number | null {
  const i = counts.findIndex((c) => c.memberId === memberId);
  return i === -1 ? null : i + 1;
}

async function allTimeCounts() {
  const grouped = await prisma.recitation.groupBy({ by: ["memberId"], _count: { _all: true }, _max: { submittedAt: true } });
  return grouped
    .map((g) => ({ memberId: g.memberId, count: g._count._all, reachedAt: g._max.submittedAt ?? new Date(0) }))
    .sort(byRank);
}

/** All-time submission totals, most frequent first. */
export async function getAllTimeLeaderboard(limit = 50) {
  return withMemberInfo(await allTimeCounts(), limit);
}

async function weeklyStreakCounts() {
  const verses = await prisma.verse.findMany({
    // Only weeks that have actually begun count toward the streak — a
    // verse scheduled for a future week (approved ahead of time) must not
    // look like a "missed week" yet.
    where: { publishedAt: { not: null }, weekOf: { lte: new Date() } },
    orderBy: { weekOf: "desc" },
    select: { id: true },
  });
  if (verses.length === 0) return [];

  const recitations = await prisma.recitation.findMany({
    where: { verseId: { in: verses.map((v) => v.id) } },
    select: { memberId: true, verseId: true, submittedAt: true },
  });
  const byMember = new Map<string, Map<string, Date>>();
  for (const r of recitations) {
    if (!byMember.has(r.memberId)) byMember.set(r.memberId, new Map());
    byMember.get(r.memberId)!.set(r.verseId, r.submittedAt);
  }

  return [...byMember.entries()]
    .map(([memberId, submitted]) => {
      // Walk weeks from most recent backward; stop at the first missed week.
      let streak = 0;
      for (const v of verses) {
        if (!submitted.has(v.id)) break;
        streak++;
      }
      // A streak is "reached" when the most recent week's verse is submitted.
      return { memberId, count: streak, reachedAt: submitted.get(verses[0].id) ?? new Date(0) };
    })
    .sort(byRank);
}

/** Current consecutive-week submission streak, longest first. */
export async function getWeeklyStreakLeaderboard(limit = 50) {
  return withMemberInfo(await weeklyStreakCounts(), limit);
}

/** A member's own standing on both leaderboards, for their dashboard card. */
export async function getMemberStanding(memberId: string) {
  const [allTime, streaks] = await Promise.all([allTimeCounts(), weeklyStreakCounts()]);
  return {
    allTimeCount: allTime.find((c) => c.memberId === memberId)?.count ?? 0,
    allTimeRank: rankOf(memberId, allTime),
    streak: streaks.find((c) => c.memberId === memberId)?.count ?? 0,
    streakRank: rankOf(memberId, streaks),
  };
}

/** Submission counts within [start, end), for the monthly recap email. */
export async function getMonthlyLeaderboard(start: Date, end: Date, limit = 10) {
  const grouped = await prisma.recitation.groupBy({
    by: ["memberId"],
    where: { submittedAt: { gte: start, lt: end } },
    _count: { _all: true },
    _max: { submittedAt: true },
  });
  const counts = grouped
    .map((g) => ({ memberId: g.memberId, count: g._count._all, reachedAt: g._max.submittedAt ?? new Date(0) }))
    .sort(byRank);
  return withMemberInfo(counts, limit);
}
