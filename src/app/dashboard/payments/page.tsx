import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { PROGRAM_LABEL } from "@/lib/content";
import { formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard, Panel } from "@/components/dashboard/ui";
import { BarChartCard, PaymentTrendCard } from "@/components/dashboard/Charts";
import { DataTable, type Column, type Filter, type Row } from "@/components/dashboard/DataTable";

export const metadata: Metadata = { title: "Payments" };

function lastMonths(n: number) {
  const out: { key: string; name: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, name: d.toLocaleString("en-GB", { month: "short", year: "2-digit" }) });
  }
  return out;
}
const mKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

export default async function PaymentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  if (user.role !== ROLES.EXECUTIVE && user.role !== ROLES.ADMIN && user.role !== ROLES.FINANCE) redirect("/dashboard");

  const [payments, approvedApps] = await Promise.all([
    prisma.payment.findMany({ orderBy: { createdAt: "desc" }, include: { application: { select: { reference: true, fullName: true, category: true } } } }),
    prisma.application.findMany({ where: { status: "APPROVED" }, select: { amountRequested: true, updatedAt: true } }),
  ]);

  const months = lastMonths(12);
  const completed = payments.filter((p) => p.status === "COMPLETED");
  const totalDisbursed = completed.reduce((s, p) => s + p.amount, 0);
  const totalAllocated = approvedApps.reduce((s, a) => s + (a.amountRequested ?? 0), 0);
  const pendingAmount = payments
    .filter((p) => p.status === "PENDING_BOARD" || p.status === "PENDING_EXECUTIVE")
    .reduce((s, p) => s + p.amount, 0);

  const monthly = months.map((m) => ({
    name: m.name,
    allocated: approvedApps.filter((a) => mKey(a.updatedAt) === m.key).reduce((s, a) => s + (a.amountRequested ?? 0), 0),
    disbursed: completed.filter((p) => p.paidAt && mKey(p.paidAt) === m.key).reduce((s, p) => s + p.amount, 0),
  }));
  const allocatedSeries = monthly.map((m) => ({ name: m.name, value: m.allocated }));

  const rows: Row[] = payments.map((p) => ({
    id: p.id,
    reference: p.application?.reference ?? "",
    beneficiary: p.application?.fullName ?? "",
    program: p.application?.category ?? "",
    amount: p.amount,
    status: p.status,
    method: p.method ?? "",
    date: (p.paidAt ?? p.createdAt).toISOString(),
  }));

  const columns: Column[] = [
    { key: "reference", header: "Ref", type: "mono" },
    { key: "beneficiary", header: "Beneficiary" },
    { key: "program", header: "Program", type: "program" },
    { key: "amount", header: "Amount", type: "money", align: "right" },
    { key: "status", header: "Status", type: "status" },
    { key: "method", header: "Method", type: "muted" },
    { key: "date", header: "Date", type: "date" },
  ];
  const filters: Filter[] = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "PENDING_BOARD", label: "Board review" },
        { value: "PENDING_EXECUTIVE", label: "Executive decision" },
        { value: "COMPLETED", label: "Completed" },
        { value: "REJECTED", label: "Rejected" },
      ],
    },
  ];

  return (
    <>
      <PageHeader title="Payments & allocations" subtitle="Funds allocated to approved beneficiaries and disbursements made each month." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total allocated" value={formatMoney(totalAllocated)} accent />
        <StatCard label="Total disbursed" value={formatMoney(totalDisbursed)} />
        <StatCard label="Pending disbursement" value={formatMoney(pendingAmount)} />
        <StatCard label="Payments" value={payments.length} />
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <BarChartCard title="Allocated per month" data={allocatedSeries} />
        <PaymentTrendCard title="Disbursed per month" data={monthly} />
      </div>

      <Panel title="Allocated money per month" className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-xs uppercase tracking-wider text-brand-900/50">
                <th className="px-3 py-2 font-semibold">Month</th>
                <th className="px-3 py-2 text-right font-semibold">Allocated</th>
                <th className="px-3 py-2 text-right font-semibold">Disbursed</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((m) => (
                <tr key={m.name} className="border-b border-brand-50">
                  <td className="px-3 py-2 font-medium text-brand-900">{m.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-brand-900/80">{formatMoney(m.allocated)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-brand-900/80">{formatMoney(m.disbursed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <PageHeader title="All payments" count={payments.length} />
      <DataTable columns={columns} rows={rows} searchKeys={["reference", "beneficiary"]} filters={filters} searchPlaceholder="Search payments…" />
    </>
  );
}
