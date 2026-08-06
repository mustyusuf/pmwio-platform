import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { getMemberStanding } from "@/lib/leaderboard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard, Panel, EmptyState } from "@/components/dashboard/ui";
import { RecitationRecorder } from "@/components/dashboard/RecitationRecorder";

export const metadata: Metadata = { title: "Qur'an Challenge" };

export default async function QuranChallengePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  if (user.role !== ROLES.MEMBER) redirect("/dashboard");

  const [verse, standing] = await Promise.all([
    prisma.verse.findFirst({
      where: { publishedAt: { lte: new Date() } },
      orderBy: { weekOf: "desc" },
    }),
    getMemberStanding(user.id),
  ]);

  const existing = verse
    ? await prisma.recitation.findUnique({ where: { verseId_memberId: { verseId: verse.id, memberId: user.id } } })
    : null;

  return (
    <>
      <PageHeader title="Qur'an Challenge" subtitle="Recite this week's verse and build your streak." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total recitations" value={standing.allTimeCount} accent />
        <StatCard label="All-time rank" value={standing.allTimeRank ? `#${standing.allTimeRank}` : "—"} />
        <StatCard label="Current streak" value={`${standing.streak} week${standing.streak === 1 ? "" : "s"}`} />
        <StatCard label="Streak rank" value={standing.streakRank ? `#${standing.streakRank}` : "—"} />
      </div>

      <div className="mt-6">
        <Panel
          title={verse ? verse.reference : "This week's verse"}
          action={
            <Link href="/dashboard/quran/leaderboard" className="text-sm font-semibold text-brand-700 hover:underline">
              View leaderboard →
            </Link>
          }
        >
          {!verse ? (
            <EmptyState>No verse has been published yet — check back soon.</EmptyState>
          ) : (
            <div className="space-y-4">
              <p dir="rtl" lang="ar" className="text-right text-2xl leading-relaxed text-brand-950">
                {verse.arabicText}
              </p>
              <audio controls src={`/api/verses/${verse.id}/audio`} className="w-full" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-900/50">Transliteration</p>
                <p className="mt-1 text-sm text-brand-900/80">{verse.transliteration}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-900/50">Translation</p>
                <p className="mt-1 text-sm text-brand-900/80">{verse.translation}</p>
              </div>
              <hr className="border-brand-100" />
              <RecitationRecorder
                verseId={verse.id}
                existing={
                  existing
                    ? { id: existing.id, submittedAt: existing.submittedAt.toISOString(), hasAudio: Boolean(existing.audioStoredName) }
                    : null
                }
              />
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
