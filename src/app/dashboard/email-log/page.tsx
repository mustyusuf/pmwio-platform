import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { isEmailConfigured } from "@/lib/email";
import { CAMPAIGN_KIND_LABEL } from "@/lib/email-tracking";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState, Panel } from "@/components/dashboard/ui";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Email Delivery" };

export default async function EmailLogPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.EXECUTIVE)) redirect("/dashboard");

  const campaigns = await prisma.emailCampaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { triggeredBy: { select: { name: true } } },
  });

  return (
    <>
      <PageHeader
        title="Email delivery"
        subtitle="Follow up on the verse announcements, monthly top-10 emails and broadcasts: who received each one, and who didn't."
      />
      {!isEmailConfigured() && (
        <p className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Email isn&apos;t set up on this server (the SMTP settings are missing), so nothing is being delivered. Add them in the hosting environment, then retry the failed emails below.
        </p>
      )}
      <Panel>
        {campaigns.length === 0 ? (
          <EmptyState>No emails recorded yet. They appear here as soon as one is sent.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-xs uppercase tracking-wider text-brand-900/50">
                  <th className="py-2 pr-3">Sent</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3 text-right">Delivered</th>
                  <th className="py-2 pr-3 text-right">Failed</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-brand-50 align-top">
                    <td className="whitespace-nowrap py-3 pr-3 text-brand-900/70">{formatDateTime(c.createdAt)}</td>
                    <td className="py-3 pr-3">
                      <p className="font-semibold text-brand-950">{CAMPAIGN_KIND_LABEL[c.kind] ?? c.kind}</p>
                      <p className="text-xs text-brand-900/60">{c.label}{c.triggeredBy ? ` · by ${c.triggeredBy.name}` : " · automatic"}</p>
                    </td>
                    <td className="py-3 pr-3 text-right font-semibold text-emerald-700">{c.sent} / {c.total}</td>
                    <td className={`py-3 pr-3 text-right font-semibold ${c.failed > 0 ? "text-red-700" : "text-brand-900/40"}`}>{c.failed}</td>
                    <td className="py-3 text-right">
                      <Link href={`/dashboard/email-log/${c.id}`} className="font-semibold text-brand-700 hover:underline">Details</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-brand-900/50">
          &ldquo;Delivered&rdquo; means our mail server accepted the email for that address. It can still land in a spam folder or bounce later, so if a member says they got nothing, ask them to check spam.
        </p>
      </Panel>
    </>
  );
}
