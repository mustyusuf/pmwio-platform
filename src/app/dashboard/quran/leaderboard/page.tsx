import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getAllTimeLeaderboard, getWeeklyStreakLeaderboard, getMonthlyLeaderboard, type LeaderboardEntry } from "@/lib/leaderboard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/ui";
import { QuranLeaderboardTabs, type LeaderboardTab } from "@/components/dashboard/QuranLeaderboardTabs";
import type { Row } from "@/components/dashboard/DataTable";

export const metadata: Metadata = { title: "Qur'an Challenge Leaderboard" };

// High enough that every active member shows up — DataTable paginates the
// rest, so there's no real cost to not capping this.
const LEADERBOARD_LIMIT = 1000;

export default async function QuranLeaderboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthLabel = now.toLocaleString("en-GB", { month: "long" });

  const [allTime, monthly, streaks] = await Promise.all([
    getAllTimeLeaderboard(LEADERBOARD_LIMIT),
    getMonthlyLeaderboard(monthStart, nextMonthStart, LEADERBOARD_LIMIT),
    getWeeklyStreakLeaderboard(LEADERBOARD_LIMIT),
  ]);

  const nameFor = (name: string, memberId: string) => (memberId === user.id ? `${name} (You)` : name);
  const toRows = (entries: LeaderboardEntry[]): Row[] =>
    entries.map((e) => ({
      id: e.memberId,
      rank: `#${e.rank}`,
      name: nameFor(e.name, e.memberId),
      userId: e.userId,
      count: e.count,
    }));

  const tabs: LeaderboardTab[] = [
    { key: "all-time", label: "All-time", countLabel: "Recitations", rows: toRows(allTime), emptyText: "No recitations submitted yet." },
    { key: "month", label: `This month (${monthLabel})`, countLabel: "Recitations", rows: toRows(monthly), emptyText: "No recitations submitted this month yet." },
    { key: "streak", label: "Current streak", countLabel: "Weeks", rows: toRows(streaks), emptyText: "No active streaks yet." },
  ];

  return (
    <>
      <PageHeader title="Qur'an Challenge Leaderboard" subtitle="See how your recitation habit compares." />
      <Panel>
        <QuranLeaderboardTabs tabs={tabs} />
      </Panel>
    </>
  );
}
