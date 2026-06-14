import { prisma } from "@/lib/db";
import { PROGRAM_LABEL } from "@/lib/content";
import { isApproved, isPending, isRejected } from "@/lib/status";
import { StatCard, Panel, StatusBadge, EmptyState, formatDate } from "@/components/dashboard/ui";
import { ReferralCard } from "@/components/ReferralCard";
import { confirmReferral, rejectReferral } from "@/app/actions/workflow";

export async function MemberDashboard({ userId, code }: { userId: string; code: string }) {
  const referred = await prisma.application.findMany({
    where: { referredById: userId },
    orderBy: { createdAt: "desc" },
    include: { beneficiary: { select: { name: true, userId: true } } },
  });

  const awaiting = referred.filter((a) => a.status === "PENDING_REFEREE");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total referrals" value={referred.length} accent />
        <StatCard label="Approved" value={referred.filter((a) => isApproved(a.status)).length} />
        <StatCard label="Pending" value={referred.filter((a) => isPending(a.status)).length} />
        <StatCard label="Rejected" value={referred.filter((a) => isRejected(a.status)).length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title="Awaiting your confirmation">
            <p className="-mt-2 mb-4 text-sm text-brand-900/60">
              As a referee you vouch for the people you refer. Confirm you know this
              beneficiary so their application can proceed — or reject it.
            </p>
            {awaiting.length === 0 ? (
              <EmptyState>Nothing awaiting your confirmation right now.</EmptyState>
            ) : (
              <div className="space-y-4">
                {awaiting.map((a) => (
                  <form key={a.id} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                    <input type="hidden" name="applicationId" value={a.id} />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-brand-900">{a.fullName}</p>
                        <p className="text-xs text-brand-900/50">
                          {PROGRAM_LABEL[a.category] ?? a.category} · Ref {a.reference} · {formatDate(a.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="mt-2 text-sm text-brand-900/70">{a.details}</p>
                    <textarea
                      name="comment"
                      rows={2}
                      placeholder="Optional comment / recommendation…"
                      className="mt-3 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
                    />
                    <div className="mt-3 flex gap-2">
                      <button formAction={confirmReferral} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                        I know them — confirm
                      </button>
                      <button formAction={rejectReferral} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                        Reject
                      </button>
                    </div>
                  </form>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="All referred beneficiaries">
            {referred.length === 0 ? (
              <EmptyState>You haven&apos;t referred anyone yet. Share your User ID so applicants can name you as referee.</EmptyState>
            ) : (
              <ul className="divide-y divide-brand-100">
                {referred.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-brand-900">{a.fullName}</p>
                      <p className="text-xs text-brand-900/50">{PROGRAM_LABEL[a.category] ?? a.category} · {formatDate(a.createdAt)}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <ReferralCard refereeId={code} />
        </div>
      </div>
    </div>
  );
}
