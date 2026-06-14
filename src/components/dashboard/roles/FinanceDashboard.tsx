import { prisma } from "@/lib/db";
import { PROGRAM_LABEL } from "@/lib/content";
import { StatCard, Panel, StatusBadge, EmptyState, formatDate, formatMoney } from "@/components/dashboard/ui";
import { PaymentEntryForm } from "@/components/dashboard/PaymentEntryForm";

export async function FinanceDashboard() {
  // Approved applications that don't yet have an active payment.
  const [approved, payments] = await Promise.all([
    prisma.application.findMany({
      where: { status: "APPROVED", payments: { none: { status: { not: "REJECTED" } } } },
      orderBy: { updatedAt: "desc" },
      include: { referredBy: { select: { name: true } } },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: { application: { select: { reference: true, fullName: true, category: true } } },
    }),
  ]);

  const inProgress = payments.filter((p) => p.status === "PENDING_BOARD" || p.status === "PENDING_EXECUTIVE");
  const completed = payments.filter((p) => p.status === "COMPLETED");
  const disbursed = completed.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Awaiting payment entry" value={approved.length} accent />
        <StatCard label="In approval" value={inProgress.length} />
        <StatCard label="Completed" value={completed.length} />
        <StatCard label="Total disbursed" value={formatMoney(disbursed)} />
      </div>

      <Panel title="Approved applications — enter a payment">
        <p className="-mt-2 mb-4 text-sm text-brand-900/60">
          Enter a payment for each approved beneficiary. It then goes to the Board and Executive for approval before disbursement.
        </p>
        {approved.length === 0 ? (
          <EmptyState>No approved applications are awaiting a payment entry.</EmptyState>
        ) : (
          <div className="space-y-4">
            {approved.map((a) => (
              <div key={a.id} className="rounded-2xl border border-brand-100 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-brand-900">{a.fullName}</p>
                    <p className="text-xs text-brand-900/50">{PROGRAM_LABEL[a.category] ?? a.category} · Ref {a.reference} · {a.country ?? "—"}</p>
                  </div>
                  {a.amountRequested ? <span className="text-sm font-semibold text-brand-700">Suggested: {formatMoney(a.amountRequested)}</span> : null}
                </div>
                <PaymentEntryForm applicationId={a.id} />
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Payment pipeline">
        {payments.length === 0 ? (
          <EmptyState>No payments yet.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-xs uppercase tracking-wider text-brand-900/50">
                  <th className="px-3 py-2 font-semibold">Ref</th>
                  <th className="px-3 py-2 font-semibold">Beneficiary</th>
                  <th className="px-3 py-2 text-right font-semibold">Amount</th>
                  <th className="px-3 py-2 font-semibold">Stage</th>
                  <th className="px-3 py-2 font-semibold">Entered</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-brand-50">
                    <td className="px-3 py-2 font-mono text-xs text-brand-900/70">{p.application?.reference}</td>
                    <td className="px-3 py-2">{p.application?.fullName}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatMoney(p.amount)}</td>
                    <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                    <td className="px-3 py-2 text-brand-900/60">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
