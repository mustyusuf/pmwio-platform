import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarketingHero } from "@/components/MarketingHero";
import { DonationForm } from "@/components/forms/DonationForm";
import { formatMoney } from "@/lib/format";

// Reads a donation campaign from the database, so render at request time rather
// than statically at build time (the DB does not exist during the Docker build).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await prisma.donationCampaign.findUnique({ where: { slug }, select: { title: true, description: true } });
  return campaign ? { title: campaign.title, description: campaign.description } : { title: "Donation campaign" };
}

export default async function CampaignDonationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const now = new Date();
  const campaign = await prisma.donationCampaign.findFirst({
    where: {
      slug,
      active: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    include: { donations: { where: { status: "SUCCESS" }, select: { amount: true } } },
  });
  if (!campaign) notFound();

  const raised = campaign.donations.reduce((sum, donation) => sum + donation.amount, 0);
  const progress = campaign.goalAmount ? Math.min(100, (raised / campaign.goalAmount) * 100) : 0;

  return (
    <>
      <SiteHeader />
      <MarketingHero eyebrow="Donation campaign" title={campaign.title} subtitle={campaign.description} />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h2 className="text-2xl font-bold text-brand-950">About this appeal</h2>
          <p className="mt-4 whitespace-pre-wrap leading-relaxed text-brand-900/70">{campaign.description}</p>
          {campaign.goalAmount && (
            <div className="mt-8 rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100">
              <div className="h-3 overflow-hidden rounded-full bg-brand-100">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-3 font-semibold text-brand-900">
                {formatMoney(raised)} raised <span className="font-normal text-brand-900/55">of {formatMoney(campaign.goalAmount)}</span>
              </p>
            </div>
          )}
        </div>
        <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-5 text-xl font-bold text-brand-950">Support {campaign.title}</h2>
          <DonationForm
            campaign={{ id: campaign.id, title: campaign.title, suggestedAmount: campaign.suggestedAmount }}
            returnPath={`/donate/${campaign.slug}`}
            error={error}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
