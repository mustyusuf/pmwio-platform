import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarketingHero } from "@/components/MarketingHero";
import { ProgramIcon } from "@/components/ProgramIcon";
import { PROGRAMS } from "@/lib/content";

export const metadata: Metadata = {
  title: "What We Do",
  description: "Our three core programs: Empowerment, Orphanage Care, and Scholarships for brilliant & needy students.",
};

const DETAILS: Record<string, { eligibility: string[]; how: string; members?: boolean }> = {
  EMPOWERMENT: {
    members: true,
    eligibility: [
      "Open to registered members of the organization",
      "A clear purpose and a workable business or livelihood plan",
      "Commitment to a sustainability plan",
    ],
    how: "Members apply from their dashboard when the empowerment window is open. Provide your purpose, desired amount, cover letter, why you need support, and a sustainability plan.",
  },
  ORPHANAGE: {
    eligibility: [
      "Orphaned or vulnerable children and their guardians",
      "Referred and vouched for by a member",
      "Demonstrated need (clothing, health, feeding, tuition or stipends)",
    ],
    how: "Apply online with the child's and guardian's details, the type of need, and supporting documents. A member must confirm the referral before review.",
  },
  SCHOLARSHIP: {
    eligibility: [
      "Brilliant or needy students in public, federal or state schools (no private schools)",
      "Primary or secondary level, in our covered states",
      "Referred and vouched for by a member",
    ],
    how: "Apply online with the student's details, school information and category (needy or brilliant). Awards are capped at ₦50,000. A member must confirm the referral before review.",
  },
};

export default function ProgramsPage() {
  return (
    <>
      <SiteHeader />
      <MarketingHero
        eyebrow="What we do"
        title="Three ways we change lives."
        subtitle="From empowering women to caring for orphans and funding education, every program is designed to restore dignity and open opportunity."
      />
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="space-y-12">
          {PROGRAMS.map((p) => {
            const d = DETAILS[p.key];
            return (
              <article key={p.key} id={p.key.toLowerCase()} className="grid gap-8 rounded-3xl border border-brand-100 bg-white p-7 shadow-sm md:grid-cols-[1fr_1.4fr] sm:p-9">
                <div>
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-100 text-brand-700">
                    <ProgramIcon program={p.key} className="h-8 w-8" />
                  </div>
                  <h2 className="mt-5 text-2xl font-bold text-brand-950">{p.title}</h2>
                  <p className="mt-3 leading-relaxed text-brand-900/75">{p.description}</p>
                  {d.members ? (
                    <p className="mt-5 inline-flex rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 ring-1 ring-brand-100">For members · apply from your dashboard</p>
                  ) : (
                    <Link href={`/apply?program=${p.key}`} className="mt-5 inline-flex rounded-full bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">Apply for {p.title}</Link>
                  )}
                </div>
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-600">Who can apply</h3>
                    <ul className="mt-3 space-y-2">
                      {d.eligibility.map((e) => (
                        <li key={e} className="flex gap-2 text-sm text-brand-900/75">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />{e}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-600">How it works</h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-900/75">{d.how}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-14 rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-8 py-12 text-center text-white">
          <h2 className="text-2xl font-bold sm:text-3xl">Need support, or want to help?</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">Apply for a program, or join as a member to refer and support those in need.</p>
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
