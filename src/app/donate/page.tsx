import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartHandshake } from "lucide-react";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarketingHero } from "@/components/MarketingHero";
import { DonationForm } from "@/components/forms/DonationForm";
import { formatMoney } from "@/lib/format";
import { loadSiteContent } from "@/lib/content-store";

// Reads donation campaigns from the database, so render at request time rather
// than statically at build time (the DB does not exist during the Docker build).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Donate",
  description: "Support PMWIO's orphanage care, scholarships and women empowerment work.",
};

export default async function DonatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; payment?: string }>;
}) {
  const { error, payment } = await searchParams;
  const sc = await loadSiteContent();
  const now = new Date();
  const campaigns = await prisma.donationCampaign.findMany({
    where: {
      active: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    include: { donations: { where: { status: "SUCCESS" }, select: { amount: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <SiteHeader />
      <MarketingHero
        eyebrow={sc.get("donate.hero.eyebrow")}
        title={sc.get("donate.hero.title")}
        subtitle={sc.get("donate.hero.subtitle")}
      />
      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-700">
              <HeartHandshake className="h-7 w-7" aria-hidden />
            </div>
            <h2 className="mt-5 text-3xl font-bold text-brand-950">{sc.get("donate.general.title")}</h2>
            <p className="mt-4 leading-relaxed text-brand-900/70">
              {sc.get("donate.general.text")}
            </p>
            <ul className="mt-6 space-y-3 text-sm text-brand-900/70">
              <li>• Secure payment through Paystack</li>
              <li>• Instant payment confirmation</li>
              <li>• Members can set up monthly contributions from their dashboard</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
            {payment === "success" && <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Thank you. Your donation was received successfully.</p>}
            {payment === "pending" && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Your payment is being confirmed. The donation record will update shortly.</p>}
            {payment === "failed" && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">We could not verify that payment. Please try again.</p>}
            <DonationForm returnPath="/donate" error={error} />
          </div>
        </section>

        {campaigns.length > 0 && (
          <section className="bg-brand-50 py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">{sc.get("donate.appeals.eyebrow")}</p>
                <h2 className="mt-2 text-3xl font-bold text-brand-950">{sc.get("donate.appeals.title")}</h2>
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.map((campaign) => {
                  const raised = campaign.donations.reduce((sum, donation) => sum + donation.amount, 0);
                  const progress = campaign.goalAmount ? Math.min(100, (raised / campaign.goalAmount) * 100) : 0;
                  return (
                    <article key={campaign.id} className="flex flex-col rounded-3xl border border-brand-100 bg-white p-6 shadow-sm">
                      <h3 className="text-xl font-bold text-brand-950">{campaign.title}</h3>
                      <p className="mt-3 line-clamp-4 flex-1 text-sm leading-relaxed text-brand-900/65">{campaign.description}</p>
                      {campaign.goalAmount && (
                        <div className="mt-5">
                          <div className="h-2 overflow-hidden rounded-full bg-brand-100">
                            <div className="h-full rounded-full bg-brand-600" style={{ width: `${progress}%` }} />
                          </div>
                          <p className="mt-2 text-xs font-medium text-brand-900/60">
                            {formatMoney(raised)} raised of {formatMoney(campaign.goalAmount)}
                          </p>
                        </div>
                      )}
                      <Link href={`/donate/${campaign.slug}`} className="mt-6 inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-900">
                        Support this cause <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
