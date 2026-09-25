import type { Metadata } from "next";
import Link from "next/link";
import { Check, GraduationCap, House, ShieldCheck, Sparkles, Stethoscope, Utensils } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarketingHero } from "@/components/MarketingHero";
import { PartnerLogoGrid } from "@/components/PartnerLogoGrid";
import { FaqAccordion } from "@/components/FaqAccordion";
import { loadSiteContent } from "@/lib/content-store";
import { getPartners } from "@/lib/partners";

export const metadata: Metadata = {
  title: "Sponsor an Orphan",
  description: "Sponsor an orphan through our Kafala program — see what your support covers, our sponsorship tiers, and the partners and supporters behind our orphanage care.",
};

const COVER_ICONS = [Utensils, GraduationCap, Stethoscope, House];

function linesOf(text: string) {
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

export default async function OrphanagePage() {
  const sc = await loadSiteContent();
  const { partners, supporters } = await getPartners();

  const coverage = [1, 2, 3, 4].map((n, i) => ({
    title: sc.get(`orphanage.cover${n}.title`),
    desc: sc.get(`orphanage.cover${n}.desc`),
    Icon: COVER_ICONS[i],
  }));

  const tiers = [1, 2, 3].map((n) => ({
    name: sc.get(`orphanage.tier${n}.name`),
    price: sc.get(`orphanage.tier${n}.price`),
    scope: sc.get(`orphanage.tier${n}.scope`),
    benefits: linesOf(sc.get(`orphanage.tier${n}.benefits`)),
  }));

  const steps = linesOf(sc.get("orphanage.process.steps"));
  const faqs = [1, 2, 3].map((n) => ({ q: sc.get(`orphanage.faq${n}.q`), a: sc.get(`orphanage.faq${n}.a`) }));

  return (
    <>
      <SiteHeader />
      <MarketingHero
        eyebrow={sc.get("orphanage.hero.eyebrow")}
        title={sc.get("orphanage.hero.title")}
        subtitle={sc.get("orphanage.hero.subtitle")}
      />
      <main>
        {/* Hadith callout */}
        <section className="mx-auto max-w-4xl px-4 pt-14 sm:px-6">
          <blockquote className="rounded-3xl border border-brand-100 bg-brand-50/60 p-7 text-center">
            <p className="text-lg italic leading-relaxed text-brand-900/85">{sc.get("orphanage.hadith")}</p>
            <p className="mt-3 text-sm font-semibold text-brand-700">— {sc.get("orphanage.hadith.source")}</p>
          </blockquote>
        </section>

        {/* Islamic principle */}
        <section className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">{sc.get("orphanage.principle.title")}</h2>
          <p className="mt-4 leading-relaxed text-brand-900/75">{sc.get("orphanage.principle.text")}</p>
        </section>

        {/* What your support covers */}
        <section className="bg-brand-50/60 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">What Your Support Covers</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {coverage.map((c) => (
                <div key={c.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-100 text-brand-700">
                    <c.Icon className="h-5 w-5" aria-hidden strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-3 font-bold text-brand-900">{c.title}</h3>
                  <p className="mt-1.5 text-sm text-brand-900/65">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sponsorship tiers */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">{sc.get("orphanage.tiers.title")}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {tiers.map((t, i) => (
              <article
                key={t.name}
                className={`flex flex-col rounded-3xl border p-7 shadow-sm transition duration-200 hover:-translate-y-1.5 hover:shadow-xl ${i === 1 ? "border-brand-700 bg-brand-900 text-white hover:shadow-brand-900/30" : "border-brand-100 bg-white hover:border-brand-300"}`}
              >
                <h3 className={`text-xl font-bold ${i === 1 ? "text-white" : "text-brand-950"}`}>{t.name}</h3>
                <p className={`mt-2 text-lg font-extrabold ${i === 1 ? "text-crimson-300" : "text-brand-700"}`}>{t.price}</p>
                <p className={`mt-4 flex-1 text-sm leading-relaxed ${i === 1 ? "text-brand-100" : "text-brand-900/70"}`}>{t.scope}</p>
                <ul className="mt-5 space-y-2">
                  {t.benefits.map((b) => (
                    <li key={b} className={`flex gap-2 text-sm ${i === 1 ? "text-brand-100" : "text-brand-900/70"}`}>
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${i === 1 ? "text-crimson-300" : "text-brand-600"}`} aria-hidden />{b}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/donate"
                  className={`mt-6 inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold transition ${i === 1 ? "bg-white text-brand-900 hover:bg-brand-50" : "bg-brand-700 text-white hover:bg-brand-800"}`}
                >
                  Sponsor Now
                </Link>
              </article>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-brand-900/60">{sc.get("orphanage.tiers.note")}</p>
        </section>

        {/* How it works */}
        <section className="bg-brand-50/60 py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">{sc.get("orphanage.process.title")}</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <div key={s} className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-brand-100">
                  <div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white">{i + 1}</div>
                  <p className="mt-3 text-sm font-medium text-brand-900/80">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Policy */}
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-brand-100 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
                <ShieldCheck className="h-5 w-5" aria-hidden strokeWidth={1.8} />
              </div>
              <h2 className="text-xl font-bold text-brand-950">{sc.get("orphanage.policy.title")}</h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-brand-900/70">{sc.get("orphanage.policy.text")}</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-brand-50/60 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">{sc.get("orphanage.faq.title")}</h2>
            <FaqAccordion items={faqs} />
          </div>
        </section>

        {/* Partners */}
        {partners.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">{sc.get("orphanage.partners.eyebrow")}</span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">{sc.get("orphanage.partners.title")}</h2>
              <p className="mt-4 text-brand-900/70">{sc.get("orphanage.partners.subtitle")}</p>
            </div>
            <PartnerLogoGrid items={partners} />
          </section>
        )}

        {/* Supporters */}
        {supporters.length > 0 && (
          <section className="bg-brand-50/60 py-16">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
              <div className="mx-auto max-w-2xl text-center">
                <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">{sc.get("orphanage.supporters.eyebrow")}</span>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">{sc.get("orphanage.supporters.title")}</h2>
                <p className="mt-4 text-brand-900/70">{sc.get("orphanage.supporters.subtitle")}</p>
              </div>
              <PartnerLogoGrid items={supporters} />
            </div>
          </section>
        )}

        {/* Closing CTA */}
        <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
          <div className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-8 py-12 text-white">
            <Sparkles className="mx-auto h-8 w-8 text-crimson-300" aria-hidden />
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">{sc.get("orphanage.cta.title")}</h2>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link href="/donate" className="rounded-full bg-white px-7 py-3.5 font-semibold text-brand-800 transition hover:bg-brand-50">Sponsor an Orphan Now</Link>
              <Link href="/donate" className="rounded-full px-7 py-3.5 font-semibold text-white ring-1 ring-white/40 transition hover:bg-white/10">Make a One-Time Donation</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
