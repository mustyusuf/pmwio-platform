import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, HandHeart, Search, Sprout } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarketingHero } from "@/components/MarketingHero";
import { ORG, IMPACT_STATS } from "@/lib/content";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about the Pious Muslim Women International Organization — our mission, values and how we work.",
};

const APPROACH = [
  { t: "Find & Fund", d: "We identify the most vulnerable women and children in our communities and mobilise the resources needed to support them.", Icon: Search },
  { t: "Provide Care", d: "We deliver shelter, nutrition, clothing and healthcare to orphans and widows, restoring dignity and hope.", Icon: HandHeart },
  { t: "We Educate", d: "We fund tuition, books and materials so brilliant, needy students can stay in school and thrive.", Icon: GraduationCap },
  { t: "We Empower", d: "We equip women with vocational skills, mentorship and startup capital to build sustainable livelihoods.", Icon: Sprout },
];

const VALUES = [
  { t: "Compassion", d: "Every action is rooted in mercy and genuine care for those we serve." },
  { t: "Integrity", d: "We are transparent and accountable with every donation and decision." },
  { t: "Faith", d: "Our work is an expression of our values — service to humanity as worship." },
  { t: "Excellence", d: "We hold ourselves to the highest standards in everything we do." },
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <MarketingHero
        eyebrow="About us"
        title="Faith in action, across the world."
        subtitle={ORG.blurb}
      />
      <main>
        {/* Mission */}
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">Our mission</h2>
              <p className="mt-4 leading-relaxed text-brand-900/75">
                The Pious Muslim Women International Organization is a registered Islamic
                non-governmental organization dedicated to uplifting and supporting
                vulnerable groups. With members across Nigeria, Ghana, Europe and America,
                we unite women of faith to care for orphans, empower widows, and open the
                doors of education to brilliant but needy students.
              </p>
              <p className="mt-4 leading-relaxed text-brand-900/75">
                We believe that lasting change begins with dignity — meeting immediate
                needs while investing in the skills, education and opportunity that help
                families stand on their own.
              </p>
            </div>
            <div className="rounded-3xl border border-brand-100 bg-white p-7 shadow-sm">
              <blockquote className="border-l-4 border-crimson-500 pl-4 text-lg italic text-brand-900/80">
                “At Pious Muslim Women Organization, we believe every child deserves love,
                care, and the opportunity to thrive — regardless of their circumstances.”
              </blockquote>
              <p className="mt-4 text-sm font-semibold text-brand-700">— Prof. H. T. Yusuf, Founder</p>
            </div>
          </div>
        </section>

        {/* Impact stats */}
        <section className="border-y border-brand-100 bg-brand-50">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-12 sm:px-6 md:grid-cols-4">
            {IMPACT_STATS.map((s) => (
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
            <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">How we do it</span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">Our approach</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {APPROACH.map((a) => (
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
            <h2 className="text-center text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">Our values</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES.map((v) => (
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
          <h2 className="text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">Join us in building a kinder world</h2>
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
