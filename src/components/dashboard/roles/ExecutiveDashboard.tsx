import { prisma } from "@/lib/db";
import { PROGRAM_LABEL } from "@/lib/content";
import { ROLES } from "@/lib/roles";
import { getExecutiveStats } from "@/lib/stats";
import { getSettings, eligibleCount, clampQuorum } from "@/lib/settings";
import { StatCard, Panel, EmptyState, formatDate, formatMoney } from "@/components/dashboard/ui";
import { ScholarshipPeriods } from "@/components/dashboard/ScholarshipPeriods";
import { LineChartCard, BarChartCard, PaymentTrendCard, PieChartCard } from "@/components/dashboard/Charts";
import { ApplicationVoteCard, PaymentVoteCard } from "@/components/dashboard/VoteCards";
import { castExecutiveVote, castPaymentVote } from "@/app/actions/workflow";

export async function ExecutiveDashboard({ userId }: { userId: string }) {
  const stats = await getExecutiveStats();
  const k = stats.kpis;

  const [queue, paymentsExec, settings, eligible] = await Promise.all([
    prisma.application.findMany({
      where: { status: "PENDING_EXECUTIVE" },
      orderBy: { createdAt: "asc" },
      include: { reviews: { include: { reviewer: { select: { name: true } } }, orderBy: { createdAt: "asc" } } },
    }),
    prisma.payment.findMany({ where: { status: "PENDING_EXECUTIVE" }, orderBy: { createdAt: "asc" }, include: { application: { select: { reference: true, fullName: true, category: true } }, approvals: true } }),
    getSettings(),
    eligibleCount(ROLES.EXECUTIVE),
  ]);

  const quorum = clampQuorum(settings.executiveQuorum, eligible);
  const myAppVote = (reviews: { reviewerId: string; reviewerRole: string; recommendation: string }[]) => {
    const m = reviews.find((r) => r.reviewerId === userId && r.reviewerRole === "EXECUTIVE");
    return m ? (m.recommendation.includes("APPROVE") ? "APPROVE" : "REJECT") : null;
  };
  const myPayVote = (approvals: { approverId: string; role: string; decision: string }[]) => {
    const m = approvals.find((a) => a.approverId === userId && a.role === "EXECUTIVE");
    return m ? m.decision : null;
  };

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total applications" value={k.totalApplications} accent />
        <StatCard label="Pending" value={k.pending} />
        <StatCard label="Approved" value={k.approved} />
        <StatCard label="Rejected" value={k.rejected} />
        <StatCard label="Total beneficiaries" value={k.totalBeneficiaries} />
        <StatCard label="Scholarship" value={k.scholarship} />
        <StatCard label="Empowerment" value={k.empowerment} />
        <StatCard label="Orphanage" value={k.orphanage} />
        <StatCard label="Funds disbursed" value={formatMoney(k.disbursed)} accent />
        <StatCard label="Pending payments" value={k.pendingPayments} />
        <StatCard label="Completed payments" value={k.completedPayments} />
        <StatCard label="Active projects" value={k.activeProjects} />
      </div>

      {/* Charts */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <LineChartCard title="Monthly applications" data={stats.charts.monthlyApplications} />
        <LineChartCard title="Monthly approvals" data={stats.charts.monthlyApprovals} />
        <PaymentTrendCard title="Payment trends (disbursed)" data={stats.charts.paymentTrends} />
        <PieChartCard title="Beneficiary distribution" data={stats.charts.beneficiaryDistribution} />
        <BarChartCard title="Program performance (approved)" data={stats.charts.programPerformance} />
        <PieChartCard title="Geographic distribution" data={stats.charts.geographicDistribution} />
      </div>

      {/* Queues */}
      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <Panel title="Final approval queue">
          <p className="-mt-2 mb-4 text-sm text-brand-900/60">
            {quorum} of {eligible} executives must approve before an application is granted.
          </p>
          {queue.length === 0 ? (
            <EmptyState>No applications awaiting an executive decision.</EmptyState>
          ) : (
            <div className="space-y-4">
              {queue.map((a) => (
                <ApplicationVoteCard key={a.id} app={a} stage="EXECUTIVE" quorum={quorum} eligible={eligible} myVote={myAppVote(a.reviews)} action={castExecutiveVote} />
              ))}
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Payments — final approval">
            <p className="-mt-2 mb-4 text-xs text-brand-900/60">Approved by the Board; your approval disburses the funds.</p>
            {paymentsExec.length === 0 ? (
              <EmptyState>No payments awaiting final approval.</EmptyState>
            ) : (
              <div className="space-y-4">
                {paymentsExec.map((p) => (
                  <PaymentVoteCard key={p.id} payment={p} level="EXECUTIVE" quorum={quorum} eligible={eligible} myVote={myPayVote(p.approvals)} action={castPaymentVote} />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Active projects">
            {stats.projects.length === 0 ? (
              <EmptyState>No active projects.</EmptyState>
            ) : (
              <ul className="space-y-2 text-sm">
                {stats.projects.map((p) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <span className="text-brand-900/80">{p.name}</span>
                    <span className="text-xs text-brand-900/40">{p.category ? PROGRAM_LABEL[p.category] : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Upcoming activities">
            {stats.activities.length === 0 ? (
              <EmptyState>No upcoming activities.</EmptyState>
            ) : (
              <ul className="space-y-2 text-sm">
                {stats.activities.map((act) => (
                  <li key={act.id}>
                    <p className="font-medium text-brand-900">{act.title}</p>
                    <p className="text-xs text-brand-900/50">{formatDate(act.date)}{act.location ? ` · ${act.location}` : ""}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <ScholarshipPeriods />
    </div>
  );
}
