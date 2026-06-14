import { prisma } from "@/lib/db";
import { PROGRAMS } from "@/lib/content";
import { ROLES } from "@/lib/roles";
import { getSettings, eligibleCount, clampQuorum } from "@/lib/settings";
import { StatCard, Panel, EmptyState } from "@/components/dashboard/ui";
import { ScholarshipPeriods } from "@/components/dashboard/ScholarshipPeriods";
import { ApplicationVoteCard, PaymentVoteCard } from "@/components/dashboard/VoteCards";
import { castBoardVote, castPaymentVote } from "@/app/actions/workflow";

export async function BoardDashboard({ userId }: { userId: string }) {
  const [toReview, myReviews, byCategory, paymentsBoard, settings, eligible] = await Promise.all([
    prisma.application.findMany({
      where: { status: "PENDING_BOARD" },
      orderBy: { createdAt: "asc" },
      include: { reviews: { include: { reviewer: { select: { name: true } } } } },
    }),
    prisma.review.findMany({ where: { reviewerId: userId, reviewerRole: "BOARD" } }),
    prisma.application.groupBy({ by: ["category"], _count: { _all: true } }),
    prisma.payment.findMany({ where: { status: "PENDING_BOARD" }, orderBy: { createdAt: "asc" }, include: { application: { select: { reference: true, fullName: true, category: true } }, approvals: true } }),
    getSettings(),
    eligibleCount(ROLES.BOARD),
  ]);

  const quorum = clampQuorum(settings.boardQuorum, eligible);
  const recApprove = myReviews.filter((r) => r.recommendation === "RECOMMEND_APPROVE").length;
  const recReject = myReviews.filter((r) => r.recommendation === "RECOMMEND_REJECT").length;
  const catCount = (key: string) => byCategory.find((c) => c.category === key)?._count._all ?? 0;

  const myAppVote = (reviews: { reviewerId: string; reviewerRole: string; recommendation: string }[]) => {
    const m = reviews.find((r) => r.reviewerId === userId && r.reviewerRole === "BOARD");
    return m ? (m.recommendation.includes("APPROVE") ? "APPROVE" : "REJECT") : null;
  };
  const myPayVote = (approvals: { approverId: string; role: string; decision: string }[]) => {
    const m = approvals.find((a) => a.approverId === userId && a.role === "BOARD");
    return m ? m.decision : null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Awaiting review" value={toReview.length} accent />
        <StatCard label="Voted by you" value={myReviews.length} hint={`Quorum: ${quorum} of ${eligible}`} />
        <StatCard label="You recommended approve" value={recApprove} />
        <StatCard label="Payments to approve" value={paymentsBoard.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          <Panel title="Applications awaiting review">
            <p className="-mt-2 mb-4 text-sm text-brand-900/60">
              {quorum} of {eligible} board members must approve before an application advances to the Executive.
            </p>
            {toReview.length === 0 ? (
              <EmptyState>No applications are awaiting board review.</EmptyState>
            ) : (
              <div className="space-y-4">
                {toReview.map((a) => (
                  <ApplicationVoteCard
                    key={a.id}
                    app={a}
                    stage="BOARD"
                    quorum={quorum}
                    eligible={eligible}
                    myVote={myAppVote(a.reviews)}
                    action={castBoardVote}
                    approveLabel="Recommend approval"
                    rejectLabel="Recommend rejection"
                  />
                ))}
              </div>
            )}
          </Panel>

          {paymentsBoard.length > 0 && (
            <Panel title="Payments awaiting board approval">
              <p className="-mt-2 mb-4 text-sm text-brand-900/60">Finance entered these payments. Approve to pass them to the Executive for final approval.</p>
              <div className="space-y-4">
                {paymentsBoard.map((p) => (
                  <PaymentVoteCard key={p.id} payment={p} level="BOARD" quorum={quorum} eligible={eligible} myVote={myPayVote(p.approvals)} action={castPaymentVote} />
                ))}
              </div>
            </Panel>
          )}
        </div>

        <Panel title="Program statistics">
          <ul className="space-y-3">
            {PROGRAMS.map((p) => (
              <li key={p.key} className="flex items-center justify-between">
                <span className="text-sm text-brand-900/70">{p.title}</span>
                <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-700">{catCount(p.key)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <ScholarshipPeriods />
    </div>
  );
}
