import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, HandHeart, Search, Sprout } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarketingHero } from "@/components/MarketingHero";
import { loadSiteContent } from "@/lib/content-store";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about the Pious Muslim Women International Organization — our mission, values and how we work.",
};

const APPROACH_ICONS = [Search, HandHeart, GraduationCap, Sprout];

export default async function AboutPage() {
  const sc = await loadSiteContent();
  const impactStats = [1, 2, 3, 4].map((n) => ({ value: sc.get(`impact.${n}.value`), label: sc.get(`impact.${n}.label`) }));
  const approach = [1, 2, 3, 4].map((n, i) => ({ t: sc.get(`about.approach${n}.title`), d: sc.get(`about.approach${n}.desc`), Icon: APPROACH_ICONS[i] }));
  const values = [1, 2, 3, 4].map((n) => ({ t: sc.get(`about.value${n}.title`), d: sc.get(`about.value${n}.desc`) }));
  return (
    <>
      <SiteHeader />
      <MarketingHero
        eyebrow={sc.get("about.hero.eyebrow")}
        title={sc.get("about.hero.title")}
        subtitle={sc.get("org.blurb")}
      />
      <main>
        {/* Mission */}
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">{sc.get("about.mission.title")}</h2>
              <p className="mt-4 leading-relaxed text-brand-900/75">{sc.get("about.mission.p1")}</p>
              <p className="mt-4 leading-relaxed text-brand-900/75">{sc.get("about.mission.p2")}</p>
            </div>
            <div className="rounded-3xl border border-brand-100 bg-white p-7 shadow-sm">
              <blockquote className="border-l-4 border-crimson-500 pl-4 text-lg italic text-brand-900/80">
                “{sc.get("about.quote")}”
              </blockquote>
              <p className="mt-4 text-sm font-semibold text-brand-700">— {sc.get("about.founder")}</p>
            </div>
          </div>
        </section>

        {/* Impact stats */}
        <section className="border-y border-brand-100 bg-brand-50">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-12 sm:px-6 md:grid-cols-4">
            {impactStats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold text-brand-700 sm:text-4xl">{s.value}</div>
                <div className="mt-1 text-sm font-medium text-brand-900/70">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How we do it */}
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">{sc.get("about.how.eyebrow")}</span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">{sc.get("about.how.title")}</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {approach.map((a) => (
              <div key={a.t} className="rounded-3xl border border-brand-100 bg-white p-6 shadow-sm">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-100 text-brand-700">
                  <a.Icon className="h-6 w-6" aria-hidden strokeWidth={1.8} />
                </div>
                <h3 className="mt-3 text-lg font-bold text-brand-900">{a.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-900/70">{a.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="bg-brand-50/60 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">{sc.get("about.values.title")}</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((v) => (
                <div key={v.t} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
                  <h3 className="font-bold text-brand-800">{v.t}</h3>
                  <p className="mt-1.5 text-sm text-brand-900/65">{v.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">{sc.get("about.cta.title")}</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="/register" className="rounded-full bg-brand-700 px-7 py-3.5 font-semibold text-white shadow-sm transition hover:bg-brand-800">Become a member</Link>
            <Link href="/programs" className="rounded-full border border-brand-200 px-7 py-3.5 font-semibold text-brand-700 transition hover:bg-brand-50">Explore our programs</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
