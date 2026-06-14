import Link from "next/link";
import { PROGRAM_LABEL } from "@/lib/content";
import { tally } from "@/lib/settings";
import { formatMoney } from "@/lib/format";

type ReviewLite = { id: string; reviewerRole: string; recommendation: string; comment: string | null; reviewer?: { name: string } };

/** A compact quorum progress meter. */
function Quorum({ approve, reject, quorum, eligible }: { approve: number; reject: number; quorum: number; eligible: number }) {
  return (
    <div className="mt-3 rounded-xl bg-brand-50 p-3">
      <div className="flex items-center justify-between text-xs font-medium text-brand-900/70">
        <span>Approvals needed: <strong className="text-brand-900">{quorum}</strong> of {eligible} eligible</span>
        <span>{approve} approve · {reject} reject</span>
      </div>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: quorum }).map((_, i) => (
          <span key={i} className={`h-2 flex-1 rounded-full ${i < approve ? "bg-emerald-500" : i < approve + reject ? "bg-red-300" : "bg-brand-200"}`} />
        ))}
      </div>
    </div>
  );
}

function VotedBadge({ vote }: { vote: string }) {
  const ok = vote === "APPROVE";
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}>
      ✓ You voted: {ok ? "Approve" : "Reject"}
    </span>
  );
}

export function ApplicationVoteCard({
  app,
  stage,
  quorum,
  eligible,
  myVote,
  action,
  approveLabel = "Approve",
  rejectLabel = "Reject",
}: {
  app: { id: string; reference: string; fullName: string; category: string; details: string; country: string | null; referredByCode?: string; boardRecommendation?: string | null; reviews: ReviewLite[] };
  stage: "BOARD" | "EXECUTIVE";
  quorum: number;
  eligible: number;
  myVote: string | null;
  action: (formData: FormData) => void | Promise<void>;
  approveLabel?: string;
  rejectLabel?: string;
}) {
  const stageVotes = app.reviews.filter((r) => r.reviewerRole === stage);
  const { approve, reject } = tally(stageVotes);
  const priorComments = app.reviews.filter((r) => r.comment && r.reviewerRole !== stage);

  return (
    <div className="rounded-2xl border border-brand-100 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-brand-900">{app.fullName}</p>
          <p className="text-xs text-brand-900/50">
            {PROGRAM_LABEL[app.category] ?? app.category} · Ref {app.reference} · {app.country ?? "—"}
          </p>
        </div>
        {stage === "EXECUTIVE" && app.boardRecommendation && (
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${app.boardRecommendation === "APPROVE" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}>
            Board: recommend {app.boardRecommendation.toLowerCase()}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-brand-900/70">{app.details}</p>
      <Link href={`/dashboard/applications/${app.id}`} className="mt-2 inline-block text-xs font-semibold text-brand-700 hover:text-brand-900">View full details & audit →</Link>

      {priorComments.map((r) => (
        <p key={r.id} className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-900/70">
          <span className="font-semibold">{r.reviewerRole[0] + r.reviewerRole.slice(1).toLowerCase()} {r.reviewer?.name}:</span> {r.comment}
        </p>
      ))}

      <Quorum approve={approve} reject={reject} quorum={quorum} eligible={eligible} />

      {myVote ? (
        <div className="mt-3"><VotedBadge vote={myVote} /></div>
      ) : (
        <form action={action} className="mt-3">
          <input type="hidden" name="applicationId" value={app.id} />
          <textarea name="comment" rows={2} placeholder="Comment / observation (optional)…" className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500" />
          <div className="mt-2 flex gap-2">
            <button type="submit" name="decision" value="APPROVE" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">{approveLabel}</button>
            <button type="submit" name="decision" value="REJECT" className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">{rejectLabel}</button>
          </div>
        </form>
      )}
    </div>
  );
}

export function PaymentVoteCard({
  payment,
  level,
  quorum,
  eligible,
  myVote,
  action,
}: {
  payment: { id: string; amount: number; method: string | null; reference: string | null; application?: { reference: string; fullName: string; category: string } | null; approvals: { id: string; role: string; decision: string }[] };
  level: "BOARD" | "EXECUTIVE";
  quorum: number;
  eligible: number;
  myVote: string | null;
  action: (formData: FormData) => void | Promise<void>;
}) {
  // Only count votes cast at this level (board approvals don't count toward the
  // executive quorum, and vice-versa).
  const { approve, reject } = tally(payment.approvals.filter((a) => a.role === level));

  return (
    <div className="rounded-2xl border border-brand-100 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-brand-900">{formatMoney(payment.amount)}</p>
          <p className="text-xs text-brand-900/50">
            {payment.application?.fullName} · {payment.application ? PROGRAM_LABEL[payment.application.category] : ""} · Ref {payment.application?.reference}
          </p>
        </div>
      </div>
      {(payment.method || payment.reference) && (
        <p className="mt-1 text-xs text-brand-900/55">{payment.method}{payment.reference ? ` · ${payment.reference}` : ""}</p>
      )}

      <Quorum approve={approve} reject={reject} quorum={quorum} eligible={eligible} />

      {myVote ? (
        <div className="mt-3"><VotedBadge vote={myVote} /></div>
      ) : (
        <form action={action} className="mt-3">
          <input type="hidden" name="paymentId" value={payment.id} />
          <textarea name="comment" rows={2} placeholder="Comment (optional)…" className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500" />
          <div className="mt-2 flex gap-2">
            <button type="submit" name="decision" value="APPROVE" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Approve payment</button>
            <button type="submit" name="decision" value="REJECT" className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Reject</button>
          </div>
        </form>
      )}
    </div>
  );
}
