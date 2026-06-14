import Link from "next/link";
import { prisma } from "@/lib/db";
import { PROGRAM_LABEL } from "@/lib/content";
import { isApproved, isPending } from "@/lib/status";
import { StatCard, Panel, StatusBadge, EmptyState, formatDate, formatMoney } from "@/components/dashboard/ui";
import { addDocument } from "@/app/actions/beneficiary";
import { markNotificationsRead } from "@/app/actions/workflow";

const STAGES = ["Submitted", "Referee", "Board", "Executive", "Decision"];
function stageIndex(status: string) {
  switch (status) {
    case "PENDING_REFEREE": return 1;
    case "PENDING_BOARD": return 2;
    case "PENDING_EXECUTIVE": return 3;
    case "APPROVED":
    case "REJECTED":
    case "REFEREE_REJECTED": return 4;
    default: return 0;
  }
}

export async function BeneficiaryDashboard({ userId }: { userId: string }) {
  const [applications, notifications] = await Promise.all([
    prisma.application.findMany({
      where: { beneficiaryId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        documents: { orderBy: { submittedAt: "desc" } },
        payments: { orderBy: { createdAt: "desc" } },
        reviews: { orderBy: { createdAt: "asc" }, include: { reviewer: { select: { name: true } } } },
      },
    }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);

  const fundsReceived = applications
    .flatMap((a) => a.payments)
    .filter((p) => p.status === "COMPLETED")
    .reduce((s, p) => s + p.amount, 0);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Applications" value={applications.length} accent />
        <StatCard label="Approved" value={applications.filter((a) => isApproved(a.status)).length} />
        <StatCard label="In progress" value={applications.filter((a) => isPending(a.status)).length} />
        <StatCard label="Funds received" value={formatMoney(fundsReceived)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Panel
            title="My applications"
            action={<Link href="/apply" className="text-sm font-semibold text-brand-700 hover:text-brand-900">+ New application</Link>}
          >
            {applications.length === 0 ? (
              <EmptyState>
                You have no applications yet.{" "}
                <Link href="/apply" className="font-semibold text-brand-700">Apply for a program →</Link>
              </EmptyState>
            ) : (
              <div className="space-y-5">
                {applications.map((a) => {
                  const idx = stageIndex(a.status);
                  return (
                    <div key={a.id} className="rounded-2xl border border-brand-100 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-brand-900">{PROGRAM_LABEL[a.category] ?? a.category}</p>
                          <p className="text-xs text-brand-900/50">Ref {a.reference} · {formatDate(a.createdAt)}</p>
                        </div>
                        <StatusBadge status={a.status} />
                      </div>

                      {/* Stage progress */}
                      <ol className="mt-4 flex items-center gap-1">
                        {STAGES.map((s, i) => (
                          <li key={s} className="flex flex-1 flex-col items-center gap-1">
                            <div className={`h-1.5 w-full rounded-full ${i <= idx ? "bg-brand-500" : "bg-brand-100"}`} />
                            <span className={`text-[10px] ${i <= idx ? "text-brand-700" : "text-brand-900/40"}`}>{s}</span>
                          </li>
                        ))}
                      </ol>

                      {/* Reviews / comments */}
                      {a.reviews.length > 0 && (
                        <div className="mt-4 space-y-1.5">
                          {a.reviews.filter((r) => r.comment).map((r) => (
                            <p key={r.id} className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-900/70">
                              <span className="font-semibold">{r.reviewerRole[0] + r.reviewerRole.slice(1).toLowerCase()}:</span> {r.comment}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Payments */}
                      {a.payments.length > 0 && (
                        <div className="mt-4 text-xs text-brand-900/70">
                          {a.payments.map((p) => (
                            <div key={p.id} className="flex justify-between rounded-lg bg-emerald-50 px-3 py-2">
                              <span>Payment · {formatMoney(p.amount)}</span>
                              <span className="font-semibold">{p.status === "COMPLETED" ? `Paid ${p.paidAt ? formatDate(p.paidAt) : ""}` : "Pending disbursement"}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Documents */}
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-brand-900/70">Documents ({a.documents.length})</p>
                        {a.documents.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {a.documents.map((d) => (
                              <li key={d.id} className="flex items-center justify-between text-xs text-brand-900/70">
                                <span>📄 {d.name}{d.type ? ` · ${d.type}` : ""}</span>
                                <span className="text-brand-900/40">{formatDate(d.submittedAt)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <form action={addDocument} className="mt-3 flex flex-wrap gap-2">
                          <input type="hidden" name="applicationId" value={a.id} />
                          <input name="name" required placeholder="Document name (e.g. National ID)" className="min-w-0 flex-1 rounded-lg border border-brand-200 px-3 py-1.5 text-xs outline-none focus:border-brand-500" />
                          <input name="reference" placeholder="File name / link" className="min-w-0 flex-1 rounded-lg border border-brand-200 px-3 py-1.5 text-xs outline-none focus:border-brand-500" />
                          <button type="submit" className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800">Add</button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            title="Notifications"
            action={
              unread > 0 ? (
                <form action={markNotificationsRead}>
                  <button className="text-xs font-semibold text-brand-700 hover:text-brand-900">Mark all read</button>
                </form>
              ) : undefined
            }
          >
            {notifications.length === 0 ? (
              <EmptyState>No notifications yet.</EmptyState>
            ) : (
              <ul className="space-y-3">
                {notifications.map((n) => (
                  <li key={n.id} className={`rounded-xl border p-3 ${n.read ? "border-brand-100" : "border-brand-200 bg-brand-50"}`}>
                    <p className="text-sm font-semibold text-brand-900">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-xs text-brand-900/60">{n.body}</p>}
                    <p className="mt-1 text-[10px] text-brand-900/40">{formatDate(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
