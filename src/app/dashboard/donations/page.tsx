import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column, type Filter, type Row } from "@/components/dashboard/DataTable";
import { Panel, StatCard } from "@/components/dashboard/ui";
import { DonationCampaignForm } from "@/components/dashboard/DonationCampaignForm";
import { toggleDonationCampaign } from "@/app/actions/donations";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Donations" };

export default async function DonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || ![ROLES.ADMIN, ROLES.EXECUTIVE, ROLES.FINANCE].includes(user.role as typeof ROLES.ADMIN)) redirect("/dashboard");
  const { error } = await searchParams;
  const canManage = user.role === ROLES.ADMIN || user.role === ROLES.EXECUTIVE;

  const [donations, campaigns, subscriptions] = await Promise.all([
    prisma.donation.findMany({
      include: { campaign: { select: { title: true } }, member: { select: { userId: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.donationCampaign.findMany({
      include: { donations: { where: { status: "SUCCESS" }, select: { amount: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contributionSubscription.findMany({
      include: { member: { select: { name: true, userId: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const successful = donations.filter((donation) => donation.status === "SUCCESS");
  const total = successful.reduce((sum, donation) => sum + donation.amount, 0);
  const monthly = subscriptions.filter((subscription) => subscription.status === "ACTIVE").reduce((sum, subscription) => sum + subscription.amount, 0);
  const rows: Row[] = donations.map((donation) => ({
    id: donation.id,
    donor: donation.anonymous ? "Anonymous" : donation.donorName ?? donation.donorEmail,
    email: donation.donorEmail,
    type: donation.type,
    campaign: donation.campaign?.title ?? "",
    memberId: donation.member?.userId ?? "",
    amount: donation.amount,
    status: donation.status,
    channel: donation.channel ?? "",
    reference: donation.reference,
    createdAt: (donation.paidAt ?? donation.createdAt).toISOString(),
  }));
  const columns: Column[] = [
    { key: "donor", header: "Donor" },
    { key: "type", header: "Type" },
    { key: "campaign", header: "Campaign" },
    { key: "memberId", header: "Member ID", type: "mono" },
    { key: "amount", header: "Amount", type: "money", align: "right" },
    { key: "status", header: "Status", type: "status" },
    { key: "channel", header: "Channel" },
    { key: "createdAt", header: "Date", type: "date" },
  ];
  const filters: Filter[] = [
    { key: "type", label: "Type", options: [
      { value: "GENERAL", label: "General donation" },
      { value: "CAMPAIGN", label: "Campaign" },
      { value: "MEMBER_CONTRIBUTION", label: "Member contribution" },
    ] },
    { key: "status", label: "Status", options: [
      { value: "SUCCESS", label: "Successful" },
      { value: "PENDING", label: "Pending" },
      { value: "FAILED", label: "Failed" },
    ] },
  ];

  return (
    <>
      <PageHeader title="Donations & contributions" subtitle="Track public donations, campaigns and recurring member support." />
      {error && <p className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total received" value={formatMoney(total)} accent />
        <StatCard label="Successful donations" value={successful.length} />
        <StatCard label="Active monthly members" value={subscriptions.filter((item) => item.status === "ACTIVE").length} />
        <StatCard label="Expected monthly" value={formatMoney(monthly)} />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        {canManage && <Panel title="Create event or donation campaign"><DonationCampaignForm /></Panel>}
        <Panel title="Campaigns" className={canManage ? "" : "xl:col-span-2"}>
          {campaigns.length === 0 ? <p className="text-sm text-brand-900/55">No donation campaigns have been created.</p> : (
            <div className="space-y-3">
              {campaigns.map((campaign) => {
                const raised = campaign.donations.reduce((sum, donation) => sum + donation.amount, 0);
                return (
                  <div key={campaign.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 p-4">
                    <div>
                      <Link href={`/donate/${campaign.slug}`} className="font-semibold text-brand-900 hover:text-brand-700">{campaign.title}</Link>
                      <p className="mt-0.5 text-xs text-brand-900/50">
                        {formatMoney(raised)} raised{campaign.goalAmount ? ` of ${formatMoney(campaign.goalAmount)}` : ""} · Created {formatDate(campaign.createdAt)}
                      </p>
                    </div>
                    {canManage && (
                      <form action={toggleDonationCampaign}>
                        <input type="hidden" name="id" value={campaign.id} />
                        <input type="hidden" name="active" value={String(!campaign.active)} />
                        <button className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${campaign.active ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>
                          {campaign.active ? "Close campaign" : "Reopen campaign"}
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Member monthly contribution plans" className="mb-6">
        {subscriptions.length === 0 ? <p className="text-sm text-brand-900/55">No members have started monthly contributions.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-brand-100 text-xs uppercase tracking-wider text-brand-900/50"><th className="py-2 pr-3">Member</th><th className="py-2 pr-3">User ID</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Last payment</th><th className="py-2 text-right">Monthly amount</th></tr></thead>
              <tbody>{subscriptions.map((subscription) => (
                <tr key={subscription.id} className="border-b border-brand-50">
                  <td className="py-3 pr-3 font-medium">{subscription.member.name}</td>
                  <td className="py-3 pr-3 font-mono text-xs">{subscription.member.userId}</td>
                  <td className="py-3 pr-3">{subscription.status.replaceAll("_", " ")}</td>
                  <td className="py-3 pr-3">{subscription.lastPaymentAt ? formatDate(subscription.lastPaymentAt) : "—"}</td>
                  <td className="py-3 text-right font-semibold">{formatMoney(subscription.amount)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Panel>

      <DataTable columns={columns} rows={rows} searchKeys={["donor", "email", "reference", "campaign", "memberId"]} filters={filters} searchPlaceholder="Search donations…" />
    </>
  );
}
