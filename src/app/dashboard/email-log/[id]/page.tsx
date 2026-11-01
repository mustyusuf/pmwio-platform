import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { CAMPAIGN_KIND_LABEL } from "@/lib/email-tracking";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, StatCard } from "@/components/dashboard/ui";
import { RetryEmailButton } from "@/components/dashboard/RetryEmailButton";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Email Delivery" };

export default async function EmailCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.EXECUTIVE)) redirect("/dashboard");

  const { id } = await params;
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id },
    include: { triggeredBy: { select: { name: true } }, deliveries: { orderBy: [{ status: "asc" }, { email: "asc" }] } },
  });
  if (!campaign) notFound();

  return (
    <>
      <PageHeader
        title={CAMPAIGN_KIND_LABEL[campaign.kind] ?? campaign.kind}
        subtitle={`${campaign.label} · ${formatDateTime(campaign.createdAt)}${campaign.triggeredBy ? ` · sent by ${campaign.triggeredBy.name}` : " · sent automatically"}`}
      />
      <Link href="/dashboard/email-log" className="mb-4 inline-block text-sm font-semibold text-brand-700 hover:underline">← All emails</Link>
      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Recipients" value={campaign.total} />
        <StatCard label="Delivered" value={campaign.sent} accent />
        <StatCard label="Failed" value={campaign.failed} />
      </div>
      <Panel title="Recipients" action={<RetryEmailButton id={campaign.id} failed={campaign.failed} />}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-xs uppercase tracking-wider text-brand-900/50">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {campaign.deliveries.map((d) => (
                <tr key={d.id} className="border-b border-brand-50 align-top">
                  <td className="py-2.5 pr-3 font-medium text-brand-950">{d.name ?? "—"}</td>
                  <td className="py-2.5 pr-3 text-brand-900/70">{d.email}</td>
                  <td className="py-2.5 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${d.status === "SENT" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}>
                      {d.status === "SENT" ? "Delivered" : "Failed"}
                    </span>
                  </td>
                  <td className="py-2.5 text-xs text-brand-900/60">{d.error ?? (d.attempts > 1 ? `Delivered on attempt ${d.attempts}` : "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
