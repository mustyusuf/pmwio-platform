import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarketingHero } from "@/components/MarketingHero";
import { ProgramIcon } from "@/components/ProgramIcon";
import { loadSiteContent, resolvePrograms } from "@/lib/content-store";

export const metadata: Metadata = {
  title: "What We Do",
  description: "Our three core programs: Empowerment, Orphanage Care, and Scholarships for brilliant & needy students.",
};

const MEMBERS_ONLY = new Set(["EMPOWERMENT"]);

export default async function ProgramsPage() {
  const sc = await loadSiteContent();
  const programs = resolvePrograms(sc);

  return (
    <>
      <SiteHeader />
      <MarketingHero
        eyebrow={sc.get("programs.hero.eyebrow")}
        title={sc.get("programs.hero.title")}
        subtitle={sc.get("programs.hero.subtitle")}
      />
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="space-y-12">
          {programs.map((p) => {
            const k = p.key.toLowerCase();
            const eligibility = sc.get(`program.${k}.eligibility`).split("\n").map((s) => s.trim()).filter(Boolean);
            const how = sc.get(`program.${k}.how`);
            const members = MEMBERS_ONLY.has(p.key);
            return (
              <article key={p.key} id={k} className="grid gap-8 rounded-3xl border border-brand-100 bg-white p-7 shadow-sm md:grid-cols-[1fr_1.4fr] sm:p-9">
                <div>
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-100 text-brand-700">
                    <ProgramIcon program={p.key} className="h-8 w-8" />
                  </div>
                  <h2 className="mt-5 text-2xl font-bold text-brand-950">{p.title}</h2>
                  <p className="mt-3 leading-relaxed text-brand-900/75">{p.description}</p>
                  {members ? (
                    <p className="mt-5 inline-flex rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 ring-1 ring-brand-100">For members · apply from your dashboard</p>
                  ) : (
                    <Link href={`/apply?program=${p.key}`} className="mt-5 inline-flex rounded-full bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">Apply for {p.title}</Link>
                  )}
                </div>
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-600">Who can apply</h3>
                    <ul className="mt-3 space-y-2">
                      {eligibility.map((e) => (
                        <li key={e} className="flex gap-2 text-sm text-brand-900/75">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />{e}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-600">How it works</h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-900/75">{how}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-14 rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-8 py-12 text-center text-white">
          <h2 className="text-2xl font-bold sm:text-3xl">{sc.get("programs.cta.title")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">{sc.get("programs.cta.text")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="/apply" className="rounded-full bg-white px-7 py-3.5 font-semibold text-brand-800 transition hover:bg-brand-50">Apply for support</Link>
            <Link href="/register" className="rounded-full px-7 py-3.5 font-semibold text-white ring-1 ring-white/40 transition hover:bg-white/10">Become a member</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
