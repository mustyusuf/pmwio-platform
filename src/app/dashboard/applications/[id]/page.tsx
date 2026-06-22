import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText, ImageIcon, RefreshCw, Save } from "lucide-react";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isStaff, ROLES, ROLE_LABEL } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { PROGRAM_LABEL, FIELD_LABEL } from "@/lib/content";
import { getSettings, eligibleCount, clampQuorum } from "@/lib/settings";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, StatusBadge, EmptyState, formatDate, formatMoney } from "@/components/dashboard/ui";
import { ApplicationVoteCard } from "@/components/dashboard/VoteCards";
import { castBoardVote, castExecutiveVote } from "@/app/actions/workflow";
import { setScholarshipPeriod, renewScholarship } from "@/app/actions/scholarship";
import { TermReportForm } from "@/components/dashboard/TermReportForm";
import { humanSize } from "@/lib/uploads";

export const metadata: Metadata = { title: "Application" };

const STAGES = ["Submitted", "Referee", "Board", "Executive", "Decision"];
function stageIndex(status: string) {
  switch (status) {
    case "PENDING_REFEREE": return 1;
    case "PENDING_BOARD": return 2;
    case "PENDING_EXECUTIVE": return 3;
    case "APPROVED": case "REJECTED": case "REFEREE_REJECTED": return 4;
    default: return 0;
  }
}
const RECO_LABEL: Record<string, string> = {
  CONFIRM: "Confirmed referral", REJECT: "Rejected", APPROVE: "Approved",
  RECOMMEND_APPROVE: "Recommended approval", RECOMMEND_REJECT: "Recommended rejection",
};
const humanize = (k: string) => FIELD_LABEL[k] ?? k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/logout");

  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      beneficiary: { select: { name: true, userId: true, email: true, phone: true } },
      referredBy: { select: { name: true, userId: true } },
      reviews: { include: { reviewer: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      documents: { orderBy: { submittedAt: "desc" } },
      payments: { include: { approvals: { include: { approver: { select: { name: true } } }, orderBy: { createdAt: "asc" } }, createdBy: { select: { name: true } } } },
      termReports: { include: { coordinator: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!app) notFound();

  const isNominatingCoordinator = user.role === ROLES.COORDINATOR && app.referredById === user.id;
  const canView =
    isStaff(user.role) ||
    isNominatingCoordinator ||
    (user.role === ROLES.MEMBER && (app.referredById === user.id || app.beneficiaryId === user.id)) ||
    (user.role === ROLES.BENEFICIARY && app.beneficiaryId === user.id);
  if (!canView) redirect("/dashboard");

  const extra: Record<string, string> = app.formData ? JSON.parse(app.formData) : {};
  const idx = stageIndex(app.status);

  // How the beneficiary has benefited, month by month (completed disbursements
  // across all of their applications).
  const benefitPayments = app.beneficiaryId
    ? await prisma.payment.findMany({
        where: { status: "COMPLETED", application: { beneficiaryId: app.beneficiaryId } },
        include: { application: { select: { category: true, reference: true } } },
        orderBy: { paidAt: "desc" },
      })
    : [];
  const monthlyBenefits = (() => {
    const map = new Map<string, { label: string; total: number; items: { program: string; amount: number; ref: string }[] }>();
    for (const p of benefitPayments) {
      const dt = p.paidAt ?? p.createdAt;
      const key = `${dt.getFullYear()}-${String(dt.getMonth()).padStart(2, "0")}`;
      const labelStr = new Date(dt).toLocaleString("en-GB", { month: "long", year: "numeric" });
      if (!map.has(key)) map.set(key, { label: labelStr, total: 0, items: [] });
      const g = map.get(key)!;
      g.total += p.amount;
      g.items.push({ program: p.application?.category ?? "", amount: p.amount, ref: p.application?.reference ?? "" });
    }
    return [...map.values()];
  })();
  const totalBenefited = benefitPayments.reduce((s, p) => s + p.amount, 0);

  // Can the current viewer act now?
  const settings = await getSettings();
  let voteCard: React.ReactNode = null;
  if (user.role === ROLES.BOARD && app.status === "PENDING_BOARD") {
    const eligible = await eligibleCount(ROLES.BOARD);
    const mine = app.reviews.find((r) => r.reviewerId === user.id && r.reviewerRole === "BOARD");
    voteCard = (
      <ApplicationVoteCard app={app} stage="BOARD" quorum={clampQuorum(settings.boardQuorum, eligible)} eligible={eligible}
        myVote={mine ? (mine.recommendation.includes("APPROVE") ? "APPROVE" : "REJECT") : null}
        action={castBoardVote} approveLabel="Recommend approval" rejectLabel="Recommend rejection" />
    );
  } else if (user.role === ROLES.EXECUTIVE && app.status === "PENDING_EXECUTIVE") {
    const eligible = await eligibleCount(ROLES.EXECUTIVE);
    const mine = app.reviews.find((r) => r.reviewerId === user.id && r.reviewerRole === "EXECUTIVE");
    voteCard = (
      <ApplicationVoteCard app={app} stage="EXECUTIVE" quorum={clampQuorum(settings.executiveQuorum, eligible)} eligible={eligible}
        myVote={mine ? (mine.recommendation.includes("APPROVE") ? "APPROVE" : "REJECT") : null}
        action={castExecutiveVote} />
    );
  }

  const coreRows: [string, string | null | undefined][] = [
    ["Email", app.email],
    ["Phone", app.phone],
    ["Country", app.country],
    ["Desired / awarded amount", app.amountRequested ? formatMoney(app.amountRequested) : null],
  ];

  return (
    <>
      <div className="mb-4">
        <Link href="/dashboard/applications" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900">
          <ArrowLeft className="h-4 w-4" aria-hidden />Back to applications
        </Link>
      </div>
      <PageHeader
        title={app.fullName}
        subtitle={`${PROGRAM_LABEL[app.category] ?? app.category} · Ref ${app.reference} · Submitted ${formatDate(app.createdAt)}`}
        action={<StatusBadge status={app.status} />}
      />

      {/* Stage progress */}
      <div className="mb-6 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
        <ol className="flex items-center gap-2">
          {STAGES.map((s, i) => (
            <li key={s} className="flex flex-1 flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full ${i <= idx ? "bg-brand-500" : "bg-brand-100"}`} />
              <span className={`text-[11px] ${i <= idx ? "text-brand-700" : "text-brand-900/40"}`}>{s}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Action (preview-then-act) */}
          {voteCard && <Panel title="Your review">{voteCard}</Panel>}

          {/* Applicant details */}
          <Panel title="Applicant details">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {coreRows.filter(([, v]) => v).map(([k, v]) => (
                <div key={k}><dt className="text-xs font-medium uppercase tracking-wider text-brand-900/40">{k}</dt><dd className="mt-0.5 text-sm text-brand-900">{v}</dd></div>
              ))}
              {Object.entries(extra).filter(([k]) => !["purpose", "coverLetter", "whyNeeded", "sustainabilityPlan"].includes(k)).map(([k, v]) => (
                <div key={k}><dt className="text-xs font-medium uppercase tracking-wider text-brand-900/40">{humanize(k)}</dt><dd className="mt-0.5 text-sm text-brand-900">{v}</dd></div>
              ))}
            </dl>

            {/* Long-form fields (empowerment + details) */}
            <div className="mt-5 space-y-4">
              {extra.purpose ? (
                <div><p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{humanize("purpose")}</p><p className="mt-1 whitespace-pre-wrap text-sm text-brand-900/80">{extra.purpose}</p></div>
              ) : null}
              {/* WYSIWYG fields are stored as sanitized HTML */}
              {(["coverLetter", "whyNeeded", "sustainabilityPlan"] as const).map((k) =>
                extra[k] ? (
                  <div key={k}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{humanize(k)}</p>
                    <div className="rich-html mt-1 text-brand-900/80" dangerouslySetInnerHTML={{ __html: extra[k] }} />
                  </div>
                ) : null,
              )}
              <div><p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Statement / details</p><p className="mt-1 whitespace-pre-wrap text-sm text-brand-900/80">{app.details}</p></div>
            </div>
          </Panel>

          {/* Monthly benefits */}
          <Panel title="Monthly benefits" action={<span className="text-sm font-semibold text-brand-700">{formatMoney(totalBenefited)} total</span>}>
            {monthlyBenefits.length === 0 ? (
              <EmptyState>No disbursements have been made to this beneficiary yet.</EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-brand-100 text-xs uppercase tracking-wider text-brand-900/50">
                      <th className="py-2 pr-3 font-semibold">Month</th>
                      <th className="py-2 pr-3 font-semibold">Programs</th>
                      <th className="py-2 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyBenefits.map((m) => (
                      <tr key={m.label} className="border-b border-brand-50">
                        <td className="py-2 pr-3 font-medium text-brand-900">{m.label}</td>
                        <td className="py-2 pr-3 text-brand-900/60">{m.items.map((i) => `${PROGRAM_LABEL[i.program] ?? i.program} (${i.ref})`).join(", ")}</td>
                        <td className="py-2 text-right font-semibold tabular-nums text-brand-900">{formatMoney(m.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {/* Academic reports & results (scholarship) */}
          {app.category === "SCHOLARSHIP" && (
            <Panel title="Academic reports & results">
              {app.termReports.length === 0 ? (
                <EmptyState>No term reports submitted yet.</EmptyState>
              ) : (
                <ul className="space-y-3">
                  {app.termReports.map((r) => {
                    const resultDoc = r.resultStoredName ? app.documents.find((d) => d.storedName === r.resultStoredName) : null;
                    return (
                      <li key={r.id} className="rounded-xl border border-brand-100 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-brand-900">{r.term} · {r.session}</p>
                          {r.position != null && (
                            <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700">
                              {ordinal(r.position)}{r.classSize ? ` of ${r.classSize}` : ""} in class
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-brand-900/75">{r.performance}</p>
                        <p className="mt-2 text-xs text-brand-900/50">
                          By {r.coordinator.name} · {formatDate(r.createdAt)}
                          {resultDoc ? <> · <a href={`/api/files/${resultDoc.id}`} target="_blank" rel="noreferrer" className="font-semibold text-brand-700 hover:underline">View result</a></> : null}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
              {isNominatingCoordinator && (
                <div className="mt-5 border-t border-brand-100 pt-5">
                  <h3 className="mb-3 text-sm font-bold text-brand-900">Submit a term report</h3>
                  <TermReportForm applicationId={app.id} />
                </div>
              )}
            </Panel>
          )}

          {/* Audit trail */}
          <Panel title="Review & audit trail">
            {app.reviews.length === 0 ? (
              <EmptyState>No reviews recorded yet.</EmptyState>
            ) : (
              <ol className="relative space-y-4 border-l border-brand-100 pl-5">
                {app.reviews.map((r) => {
                  const approve = r.recommendation.includes("APPROVE") || r.recommendation === "CONFIRM";
                  return (
                    <li key={r.id} className="relative">
                      <span className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-2 ring-white ${approve ? "bg-emerald-500" : "bg-red-500"}`} />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-brand-900">{r.reviewer.name}</span>
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">{ROLE_LABEL[r.reviewerRole] ?? r.reviewerRole[0] + r.reviewerRole.slice(1).toLowerCase()}</span>
                        <span className={`text-xs font-medium ${approve ? "text-emerald-700" : "text-red-700"}`}>{RECO_LABEL[r.recommendation] ?? r.recommendation}</span>
                        <span className="ml-auto text-[11px] text-brand-900/40">{formatDate(r.createdAt)}</span>
                      </div>
                      {r.comment && <p className="mt-1 text-sm text-brand-900/70">“{r.comment}”</p>}
                    </li>
                  );
                })}
              </ol>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          {/* Referral */}
          <Panel title="Referral">
            <p className="text-sm text-brand-900/80"><span className="text-brand-900/50">Referred by:</span> {app.referredBy?.name ?? "—"}</p>
            <p className="mt-1 font-mono text-xs text-brand-900/60">{app.referredByCode}</p>
            {app.beneficiary && (
              <div className="mt-4 border-t border-brand-100 pt-3 text-sm">
                <p className="text-brand-900/50">Beneficiary account</p>
                <p className="font-medium text-brand-900">{app.beneficiary.name}</p>
                <p className="font-mono text-xs text-brand-900/60">{app.beneficiary.userId}</p>
              </div>
            )}
          </Panel>

          {/* Scholarship period + renewal */}
          {app.category === "SCHOLARSHIP" && (
            <Panel title="Scholarship period">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs uppercase tracking-wider text-brand-900/40">Start</p><p className="mt-0.5 text-brand-900">{app.scholarshipStart ? formatDate(app.scholarshipStart) : "Not set"}</p></div>
                <div><p className="text-xs uppercase tracking-wider text-brand-900/40">End</p><p className="mt-0.5 text-brand-900">{app.scholarshipEnd ? formatDate(app.scholarshipEnd) : "Not set"}</p></div>
              </div>

              {(user.role === ROLES.ADMIN || user.role === ROLES.EXECUTIVE) && (
                <form action={setScholarshipPeriod} className="mt-4 space-y-2 border-t border-brand-100 pt-3">
                  <input type="hidden" name="applicationId" value={app.id} />
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-brand-900/50">Start date</label><input type="date" name="start" defaultValue={app.scholarshipStart ? new Date(app.scholarshipStart).toISOString().slice(0, 10) : ""} className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm" /></div>
                    <div><label className="text-xs text-brand-900/50">End date</label><input type="date" name="end" defaultValue={app.scholarshipEnd ? new Date(app.scholarshipEnd).toISOString().slice(0, 10) : ""} className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm" /></div>
                  </div>
                  <button className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800">
                    <Save className="h-3.5 w-3.5" aria-hidden />Save period
                  </button>
                </form>
              )}

              {app.status === "APPROVED" && (isStaff(user.role) || app.beneficiaryId === user.id) && (
                <form action={renewScholarship} className="mt-3 border-t border-brand-100 pt-3">
                  <input type="hidden" name="applicationId" value={app.id} />
                  <button className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 px-4 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden />Re-apply / renew scholarship
                  </button>
                  <p className="mt-1 text-[11px] text-brand-900/40">Creates a fresh application for the next period.</p>
                </form>
              )}
            </Panel>
          )}

          {/* Documents (with preview) */}
          <Panel title={`Documents (${app.documents.length})`}>
            {app.documents.length === 0 ? (
              <EmptyState>No documents submitted.</EmptyState>
            ) : (
              <ul className="space-y-3 text-sm">
                {app.documents.map((d) => {
                  const isImage = d.mimeType?.startsWith("image/");
                  const isPdf = d.mimeType === "application/pdf";
                  const href = d.storedName ? `/api/files/${d.id}` : null;
                  return (
                    <li key={d.id} className="rounded-xl border border-brand-100 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 font-medium text-brand-900">
                          {isImage ? <ImageIcon className="h-4 w-4" aria-hidden /> : <FileText className="h-4 w-4" aria-hidden />}
                          {d.name}
                        </span>
                        <span className="text-xs text-brand-900/40">{formatDate(d.submittedAt)}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-brand-900/50">{d.type ?? "Document"}{d.size ? ` · ${humanSize(d.size)}` : ""}</p>
                      {href && isImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <a href={href} target="_blank" rel="noreferrer" className="mt-2 block">
                          <img src={href} alt={d.name} className="max-h-48 w-auto rounded-lg border border-brand-100 object-contain" />
                        </a>
                      )}
                      {href && (
                        <a href={href} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900">
                          {isPdf ? "Open PDF" : isImage ? "View full size" : "Open file"}
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {/* Payments + their approval audit */}
          <Panel title="Payments">
            {app.payments.length === 0 ? (
              <EmptyState>No payment entered yet.</EmptyState>
            ) : (
              <div className="space-y-3">
                {app.payments.map((p) => (
                  <div key={p.id} className="rounded-xl border border-brand-100 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-brand-900">{formatMoney(p.amount)}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-brand-900/50">Entered by {p.createdBy?.name ?? "—"} · {formatDate(p.createdAt)}</p>
                    {p.approvals.length > 0 && (
                      <ul className="mt-2 space-y-1 border-t border-brand-100 pt-2 text-xs">
                        {p.approvals.map((a) => (
                          <li key={a.id} className="flex justify-between">
                            <span>{a.approver.name} <span className="text-brand-900/40">({ROLE_LABEL[a.role] ?? a.role})</span></span>
                            <span className={a.decision === "APPROVE" ? "text-emerald-700" : "text-red-700"}>{a.decision === "APPROVE" ? "Approved" : "Rejected"}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
