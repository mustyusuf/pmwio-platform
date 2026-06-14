import { prisma } from "@/lib/db";
import { PROGRAMS } from "@/lib/content";
import { PENDING_STATUSES, REJECTED_STATUSES } from "@/lib/status";

/** Labels for the last `n` months, oldest first, with a key for matching. */
function lastMonths(n: number) {
  const out: { key: string; name: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      name: d.toLocaleString("en-GB", { month: "short" }),
    });
  }
  return out;
}
const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

export async function getExecutiveStats() {
  const [apps, payments, execApprovals, beneficiaries, projects, activities] = await Promise.all([
    prisma.application.findMany({
      select: { status: true, category: true, country: true, createdAt: true, beneficiaryId: true },
    }),
    prisma.payment.findMany({ select: { status: true, amount: true, paidAt: true } }),
    prisma.review.findMany({
      where: { reviewerRole: "EXECUTIVE", recommendation: "APPROVE" },
      select: { createdAt: true },
    }),
    prisma.user.count({ where: { role: "BENEFICIARY" } }),
    prisma.project.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.activity.findMany({ where: { date: { gte: new Date() } }, orderBy: { date: "asc" }, take: 6 }),
  ]);

  const months = lastMonths(6);

  // KPIs
  const pending = apps.filter((a) => PENDING_STATUSES.includes(a.status)).length;
  const approved = apps.filter((a) => a.status === "APPROVED").length;
  const rejected = apps.filter((a) => REJECTED_STATUSES.includes(a.status)).length;
  const completed = payments.filter((p) => p.status === "COMPLETED");
  const disbursed = completed.reduce((s, p) => s + p.amount, 0);

  const approvedByCat = (key: string) =>
    apps.filter((a) => a.category === key && a.status === "APPROVED").length;

  // Charts
  const monthlyApplications = months.map((m) => ({
    name: m.name,
    value: apps.filter((a) => monthKey(a.createdAt) === m.key).length,
  }));
  const monthlyApprovals = months.map((m) => ({
    name: m.name,
    value: execApprovals.filter((r) => monthKey(r.createdAt) === m.key).length,
  }));
  const paymentTrends = months.map((m) => ({
    name: m.name,
    disbursed: completed
      .filter((p) => p.paidAt && monthKey(p.paidAt) === m.key)
      .reduce((s, p) => s + p.amount, 0),
  }));
  const beneficiaryDistribution = PROGRAMS.map((p) => ({
    name: p.title,
    value: apps.filter((a) => a.category === p.key).length,
  }));
  const programPerformance = PROGRAMS.map((p) => ({ name: p.title, value: approvedByCat(p.key) }));

  const geoMap = new Map<string, number>();
  for (const a of apps) {
    const c = a.country?.trim() || "Unspecified";
    geoMap.set(c, (geoMap.get(c) ?? 0) + 1);
  }
  const geographicDistribution = [...geoMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return {
    kpis: {
      totalApplications: apps.length,
      pending,
      approved,
      rejected,
      totalBeneficiaries: beneficiaries,
      scholarship: approvedByCat("SCHOLARSHIP"),
      empowerment: approvedByCat("EMPOWERMENT"),
      orphanage: approvedByCat("ORPHANAGE"),
      disbursed,
      pendingPayments: payments.filter((p) => p.status === "PENDING_BOARD" || p.status === "PENDING_EXECUTIVE").length,
      completedPayments: completed.length,
      activeProjects: projects.filter((p) => p.status === "ACTIVE").length,
    },
    charts: {
      monthlyApplications,
      monthlyApprovals,
      paymentTrends,
      beneficiaryDistribution,
      programPerformance,
      geographicDistribution,
    },
    activities,
    projects: projects.filter((p) => p.status === "ACTIVE").slice(0, 6),
  };
}
