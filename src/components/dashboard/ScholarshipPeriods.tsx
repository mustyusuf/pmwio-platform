import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { Panel, EmptyState, StatusBadge, formatDate } from "@/components/dashboard/ui";

/** Lists scholarship beneficiaries with their award start/end dates. Shown on
 *  the Executive, Board and Administrator dashboards. */
export async function ScholarshipPeriods() {
  const apps = await prisma.application.findMany({
    where: { category: "SCHOLARSHIP" },
    orderBy: [{ scholarshipEnd: "asc" }, { createdAt: "desc" }],
    take: 8,
    include: { beneficiary: { select: { userId: true } } },
  });

  return (
    <Panel
      title="Scholarship periods"
      action={
        <Link href="/dashboard/beneficiaries?program=SCHOLARSHIP" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900">
          View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      }
    >
      {apps.length === 0 ? (
        <EmptyState>No scholarship applications yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-xs uppercase tracking-wider text-brand-900/50">
                <th className="py-2 pr-3 font-semibold">Beneficiary</th>
                <th className="py-2 pr-3 font-semibold">Start</th>
                <th className="py-2 pr-3 font-semibold">End</th>
                <th className="py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} className="border-b border-brand-50">
                  <td className="py-2 pr-3">
                    <Link href={`/dashboard/applications/${a.id}`} className="font-medium text-brand-800 hover:underline">{a.fullName}</Link>
                    <span className="ml-2 font-mono text-xs text-brand-900/40">{a.beneficiary?.userId}</span>
                  </td>
                  <td className="py-2 pr-3 text-brand-900/70">{a.scholarshipStart ? formatDate(a.scholarshipStart) : "—"}</td>
                  <td className="py-2 pr-3 text-brand-900/70">{a.scholarshipEnd ? formatDate(a.scholarshipEnd) : "—"}</td>
                  <td className="py-2"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
