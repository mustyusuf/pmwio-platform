import Link from "next/link";
import { prisma } from "@/lib/db";
import { parseStates } from "@/lib/roles";
import { isApproved, isPending, isRejected } from "@/lib/status";
import { StatCard, Panel, StatusBadge, EmptyState, formatDate } from "@/components/dashboard/ui";
import { ReferralCard } from "@/components/ReferralCard";

export async function CoordinatorDashboard({ userId, statesJson }: { userId: string; statesJson: string | null }) {
  const [nominated, reportCount, me] = await Promise.all([
    prisma.application.findMany({
      where: { category: "SCHOLARSHIP", referredById: userId },
      orderBy: { createdAt: "desc" },
      include: { beneficiary: { select: { userId: true } } },
    }),
    prisma.termReport.count({ where: { coordinatorId: userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { userId: true } }),
  ]);

  const states = parseStates(statesJson);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Nominated" value={nominated.length} accent />
        <StatCard label="Approved" value={nominated.filter((a) => isApproved(a.status)).length} />
        <StatCard label="In progress" value={nominated.filter((a) => isPending(a.status)).length} />
        <StatCard label="Reports submitted" value={reportCount} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel
            title="My scholarship beneficiaries"
            action={<Link href="/dashboard/scholarships" className="text-sm font-semibold text-brand-700 hover:text-brand-900">Monitor all →</Link>}
          >
            {nominated.length === 0 ? (
              <EmptyState>No beneficiaries nominated yet. Share your Coordinator ID with eligible applicants in your state(s).</EmptyState>
            ) : (
              <ul className="divide-y divide-brand-100">
                {nominated.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link href={`/dashboard/applications/${a.id}`} className="truncate font-medium text-brand-900 hover:underline">{a.fullName}</Link>
                      <p className="text-xs text-brand-900/50">Ref {a.reference} · {formatDate(a.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={a.status} />
                      <Link href={`/dashboard/applications/${a.id}`} className="text-xs font-semibold text-brand-700 hover:text-brand-900">Report →</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-600">States you cover</h2>
            {states.length === 0 ? (
              <p className="mt-2 text-sm text-brand-900/60">No states assigned. Contact an administrator.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {states.map((s) => (
                  <span key={s} className="rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700">{s}</span>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-brand-900/50">You can only nominate scholarship applicants from these states.</p>
          </div>

          <ReferralCard refereeId={me?.userId ?? ""} />
        </div>
      </div>
    </div>
  );
}
