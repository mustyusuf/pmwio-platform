import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { PROGRAMS } from "@/lib/content";
import { PENDING_STATUSES, REJECTED_STATUSES } from "@/lib/status";
import { formatMoney, formatDate } from "@/lib/format";
import { StatCard, Panel, EmptyState } from "@/components/dashboard/ui";
import { ScholarshipPeriods } from "@/components/dashboard/ScholarshipPeriods";

export async function AdminDashboard({ selfId }: { selfId: string }) {
  void selfId;
  const [usersByRole, apps, payments, byCategory, logs] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.application.findMany({ select: { status: true } }),
    prisma.payment.findMany({ select: { status: true, amount: true } }),
    prisma.application.groupBy({ by: ["category"], _count: { _all: true } }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 12, include: { user: { select: { name: true } } } }),
  ]);

  const roleCount = (r: string) => usersByRole.find((u) => u.role === r)?._count._all ?? 0;
  const totalUsers = usersByRole.reduce((s, u) => s + u._count._all, 0);
  const pending = apps.filter((a) => PENDING_STATUSES.includes(a.status)).length;
  const approved = apps.filter((a) => a.status === "APPROVED").length;
  const rejected = apps.filter((a) => REJECTED_STATUSES.includes(a.status)).length;
  const completedPay = payments.filter((p) => p.status === "COMPLETED");
  const disbursed = completedPay.reduce((s, p) => s + p.amount, 0);
  const catCount = (k: string) => byCategory.find((c) => c.category === k)?._count._all ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total users" value={totalUsers} accent />
        <StatCard label="Members" value={roleCount("MEMBER")} />
        <StatCard label="Beneficiaries" value={roleCount("BENEFICIARY")} />
        <StatCard label="Board" value={roleCount("BOARD")} />
        <StatCard label="Executives" value={roleCount("EXECUTIVE")} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Applications" value={apps.length} />
        <StatCard label="Pending" value={pending} />
        <StatCard label="Approved" value={approved} />
        <StatCard label="Rejected" value={rejected} />
        <StatCard label="Funds disbursed" value={formatMoney(disbursed)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
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

        <Panel title="Payment statistics">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-brand-900/60">Pending</span><span className="font-semibold">{payments.length - completedPay.length}</span></div>
            <div className="flex justify-between"><span className="text-brand-900/60">Completed</span><span className="font-semibold">{completedPay.length}</span></div>
            <div className="flex justify-between"><span className="text-brand-900/60">Total disbursed</span><span className="font-semibold">{formatMoney(disbursed)}</span></div>
          </div>
          <Link href="/dashboard/payments" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900">
            View payments <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Panel>

        <Panel title="Recent activity" action={
          <Link href="/dashboard/audit" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900">
            All logs <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        }>
          {logs.length === 0 ? (
            <EmptyState>No activity yet.</EmptyState>
          ) : (
            <ul className="space-y-2.5">
              {logs.map((l) => (
                <li key={l.id} className="text-xs">
                  <span className="font-semibold text-brand-900">{l.action.replaceAll("_", " ").toLowerCase()}</span>
                  {l.detail ? <span className="text-brand-900/60"> · {l.detail}</span> : null}
                  <div className="text-[10px] text-brand-900/40">{l.user?.name ?? "System"} · {formatDate(l.createdAt)}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/users" className="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">Manage users</Link>
        <Link href="/dashboard/members" className="rounded-full border border-brand-200 px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">View members</Link>
        <Link href="/dashboard/beneficiaries" className="rounded-full border border-brand-200 px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">View beneficiaries</Link>
      </div>

      <ScholarshipPeriods />
    </div>
  );
}
