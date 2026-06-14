import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isStaff, ROLES } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard, Panel, EmptyState } from "@/components/dashboard/ui";
import { DataTable, type Column, type Filter, type Row } from "@/components/dashboard/DataTable";

export const metadata: Metadata = { title: "Scholarship Monitoring" };

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
const parse = (s: string | null): Record<string, string> => { try { return s ? JSON.parse(s) : {}; } catch { return {}; } };
function ordinal(n: number) { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]); }

export default async function ScholarshipsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  const coordinator = user.role === ROLES.COORDINATOR;
  if (!isStaff(user.role) && !coordinator) redirect("/dashboard");

  const where = coordinator
    ? { category: "SCHOLARSHIP", referredById: user.id }
    : { category: "SCHOLARSHIP" };

  const apps = await prisma.application.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      beneficiary: { select: { userId: true } },
      payments: { select: { amount: true, status: true, paidAt: true } },
      termReports: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  // KPIs
  const approved = apps.filter((a) => a.status === "APPROVED").length;
  const completedPays = apps.flatMap((a) => a.payments).filter((p) => p.status === "COMPLETED");
  const disbursed = completedPays.reduce((s, p) => s + p.amount, 0);
  const withReports = apps.filter((a) => a.termReports.length > 0).length;

  // Monthly disbursement breakdown
  const months = lastMonths(12);
  const monthly = months.map((m) => ({
    name: m.name,
    amount: completedPays.filter((p) => p.paidAt && mKey(p.paidAt) === m.key).reduce((s, p) => s + p.amount, 0),
  }));

  // Per session + term breakdown
  const sessionMap = new Map<string, { session: string; term: string; count: number; received: number }>();
  for (const a of apps) {
    const fd = parse(a.formData);
    const session = fd.academicYear || "Unspecified";
    const term = fd.term || "—";
    const key = `${session}|${term}`;
    const received = a.payments.filter((p) => p.status === "COMPLETED").reduce((s, p) => s + p.amount, 0);
    const g = sessionMap.get(key) ?? { session, term, count: 0, received: 0 };
    g.count += 1; g.received += received;
    sessionMap.set(key, g);
  }
  const sessionRows = [...sessionMap.values()];

  // Beneficiaries table
  const rows: Row[] = apps.map((a) => {
    const fd = parse(a.formData);
    const r = a.termReports[0];
    return {
      id: a.id,
      name: a.fullName,
      userId: a.beneficiary?.userId ?? "",
      state: fd.state ?? "",
      school: fd.schoolName ?? "",
      session: fd.academicYear ?? "",
      term: fd.term ?? "",
      position: r?.position != null ? `${ordinal(r.position)}${r.classSize ? ` of ${r.classSize}` : ""}` : "",
      received: a.payments.filter((p) => p.status === "COMPLETED").reduce((s, p) => s + p.amount, 0),
      status: a.status,
    };
  });
  const columns: Column[] = [
    { key: "name", header: "Beneficiary" },
    { key: "userId", header: "User ID", type: "mono" },
    { key: "state", header: "State" },
    { key: "school", header: "School", type: "muted" },
    { key: "session", header: "Session" },
    { key: "term", header: "Term" },
    { key: "position", header: "Position" },
    { key: "received", header: "Received", type: "money", align: "right" },
    { key: "status", header: "Status", type: "status" },
  ];
  const filters: Filter[] = [
    {
      key: "status", label: "Status",
      options: [
        { value: "PENDING_REFEREE", label: "Awaiting referee" },
        { value: "PENDING_BOARD", label: "Board review" },
        { value: "PENDING_EXECUTIVE", label: "Executive decision" },
        { value: "APPROVED", label: "Approved" },
        { value: "REJECTED", label: "Rejected" },
      ],
    },
  ];

  return (
    <>
      <PageHeader
        title="Scholarship monitoring"
        count={apps.length}
        subtitle={coordinator ? "Scholarship beneficiaries you have nominated." : "All scholarship beneficiaries, payment status and performance."}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Scholarships" value={apps.length} accent />
        <StatCard label="Approved" value={approved} />
        <StatCard label="Total disbursed" value={formatMoney(disbursed)} />
        <StatCard label="With term reports" value={withReports} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Disbursement per month">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-brand-100 text-xs uppercase tracking-wider text-brand-900/50"><th className="px-3 py-2 font-semibold">Month</th><th className="px-3 py-2 text-right font-semibold">Disbursed</th></tr></thead>
              <tbody>
                {monthly.map((m) => (
                  <tr key={m.name} className="border-b border-brand-50"><td className="px-3 py-2 font-medium text-brand-900">{m.name}</td><td className="px-3 py-2 text-right tabular-nums text-brand-900/80">{formatMoney(m.amount)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="By session & term">
          {sessionRows.length === 0 ? (
            <EmptyState>No scholarship data yet.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-brand-100 text-xs uppercase tracking-wider text-brand-900/50"><th className="px-3 py-2 font-semibold">Session</th><th className="px-3 py-2 font-semibold">Term</th><th className="px-3 py-2 text-right font-semibold">Beneficiaries</th><th className="px-3 py-2 text-right font-semibold">Disbursed</th></tr></thead>
                <tbody>
                  {sessionRows.map((s) => (
                    <tr key={`${s.session}-${s.term}`} className="border-b border-brand-50">
                      <td className="px-3 py-2 font-medium text-brand-900">{s.session}</td>
                      <td className="px-3 py-2 text-brand-900/70">{s.term}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{s.count}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-brand-900/80">{formatMoney(s.received)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <PageHeader title="Beneficiaries" count={apps.length} />
      <DataTable columns={columns} rows={rows} searchKeys={["name", "userId", "school", "state"]} filters={filters} searchPlaceholder="Search scholarship beneficiaries…" linkBase="/dashboard/applications" />
    </>
  );
}
