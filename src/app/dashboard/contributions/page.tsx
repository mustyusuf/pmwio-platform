import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState, Panel, StatCard } from "@/components/dashboard/ui";
import { startMonthlyContribution } from "@/app/actions/donations";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Monthly Contributions" };

export default async function ContributionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; payment?: string }>;
}) {
  const member = await getCurrentUser();
  if (!member || member.role !== ROLES.MEMBER) redirect("/dashboard");
  const { error, payment } = await searchParams;

  const [subscription, donations] = await Promise.all([
    prisma.contributionSubscription.findUnique({
      where: { memberId: member.id },
      include: { plan: true },
    }),
    prisma.donation.findMany({
      where: { memberId: member.id, type: "MEMBER_CONTRIBUTION" },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const successful = donations.filter((donation) => donation.status === "SUCCESS");
  const total = successful.reduce((sum, donation) => sum + donation.amount, 0);

  return (
    <>
      <PageHeader title="Monthly contributions" subtitle="Set up and track your recurring support to PMWIO." />
      {payment === "success" && <p className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Your contribution was received and your monthly plan is being activated.</p>}
      {payment === "pending" && <p className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Paystack is still confirming this contribution.</p>}
      {error && <p className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total contributed" value={formatMoney(total)} accent />
        <StatCard label="Successful payments" value={successful.length} />
        <StatCard label="Monthly amount" value={subscription ? formatMoney(subscription.amount) : "—"} />
        <StatCard label="Plan status" value={subscription?.status.replaceAll("_", " ") ?? "Not set up"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Panel title={subscription?.status === "ACTIVE" ? "Your active contribution" : "Start monthly contribution"}>
          {subscription?.status === "ACTIVE" ? (
            <div className="space-y-3 text-sm text-brand-900/70">
              <p>Paystack will charge <strong className="text-brand-900">{formatMoney(subscription.amount)}</strong> every month using the payment authorization you provided.</p>
              {subscription.lastPaymentAt && <p>Last payment: <strong>{formatDate(subscription.lastPaymentAt)}</strong></p>}
              {subscription.nextPaymentAt && <p>Next expected payment: <strong>{formatDate(subscription.nextPaymentAt)}</strong></p>}
              <p className="rounded-xl bg-brand-50 p-3 text-xs">To cancel or change an active subscription, contact an administrator while subscription management controls are being reviewed.</p>
            </div>
          ) : (
            <form action={startMonthlyContribution} className="space-y-4">
              <p className="text-sm text-brand-900/65">Choose the amount you want to contribute each month. You will complete the first payment on Paystack, which authorizes future monthly charges.</p>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-brand-900">Monthly amount (₦)</label>
                <input id="amount" name="amount" type="number" min="500" step="500" defaultValue="5000" required className="mt-1.5 w-full rounded-xl border border-brand-200 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
              </div>
              <SubmitButton pendingText="Opening Paystack…">Start monthly contribution</SubmitButton>
            </form>
          )}
        </Panel>

        <Panel title="Contribution history">
          {donations.length === 0 ? (
            <EmptyState>No contribution payments yet.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-brand-100 text-xs uppercase tracking-wider text-brand-900/50"><th className="py-2">Date</th><th className="py-2">Reference</th><th className="py-2">Status</th><th className="py-2 text-right">Amount</th></tr></thead>
                <tbody>
                  {donations.map((donation) => (
                    <tr key={donation.id} className="border-b border-brand-50">
                      <td className="py-3">{formatDate(donation.paidAt ?? donation.createdAt)}</td>
                      <td className="py-3 font-mono text-xs text-brand-900/60">{donation.reference}</td>
                      <td className="py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${donation.status === "SUCCESS" ? "bg-emerald-100 text-emerald-800" : donation.status === "FAILED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>{donation.status}</span></td>
                      <td className="py-3 text-right font-semibold">{formatMoney(donation.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
