import Link from "next/link";
import { ArrowRight, HeartHandshake } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { GallerySection } from "@/components/GallerySection";
import { ProgramIcon } from "@/components/ProgramIcon";
import { getGalleryData } from "@/lib/gallery";
import { loadSiteContent, resolvePrograms } from "@/lib/content-store";

// Reads gallery items from the database, so render at request time rather than
// statically at build time (the DB does not exist during the Docker build).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { albums, photos } = await getGalleryData();
  const sc = await loadSiteContent();
  const heroImage = sc.image("home.hero.image");
  const impactStats = [1, 2, 3, 4].map((n) => ({ value: sc.get(`impact.${n}.value`), label: sc.get(`impact.${n}.label`) }));
  const programs = resolvePrograms(sc);
  const aboutCards = [1, 2, 3, 4].map((n) => ({ t: sc.get(`home.about.card${n}.title`), d: sc.get(`home.about.card${n}.desc`) }));
  return (
    <>
      <SiteHeader />
      <main>
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 text-white">
          {heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImage} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20" />
          )}
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-crimson-500/10 blur-3xl"
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-brand-100 ring-1 ring-white/15">
              {sc.get("home.hero.badge")}
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              {sc.get("home.hero.heading")}{" "}
              <span className="text-crimson-400">{sc.get("home.hero.highlight")}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-brand-100">
              {sc.get("home.hero.subtitle")}
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="rounded-full bg-white px-7 py-3.5 text-center text-base font-semibold text-brand-800 shadow-lg transition hover:bg-brand-50"
              >
                Become a member
              </Link>
              <Link
                href="/apply"
                className="rounded-full bg-brand-600 px-7 py-3.5 text-center text-base font-semibold text-white ring-1 ring-white/30 transition hover:bg-brand-500"
              >
                Apply for support
              </Link>
              <Link
                href="/donate"
                className="rounded-full bg-crimson-600 px-7 py-3.5 text-center text-base font-semibold text-white ring-1 ring-white/20 transition hover:bg-crimson-500"
              >
                Donate now
              </Link>
            </div>

            <p className="mt-6 text-sm text-brand-200">
              Already a member?{" "}
              <Link href="/login" className="font-semibold text-white underline-offset-4 hover:underline">
                Log in to your dashboard
              </Link>
            </p>
          </div>
        </section>

        {/* ---------- Impact stats ---------- */}
        <section id="impact" className="border-b border-brand-100 bg-brand-50">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-12 sm:px-6 md:grid-cols-4">
            {impactStats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold text-brand-700 sm:text-4xl">
                  {s.value}
                </div>
                <div className="mt-1 text-sm font-medium text-brand-900/70">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- About ---------- */}
        <section id="about" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">
                {sc.get("home.about.eyebrow")}
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
                {sc.get("home.about.title")}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-brand-900/75">
                {sc.get("home.about.text")}
              </p>
              <blockquote className="mt-6 border-l-4 border-crimson-500 pl-4 italic text-brand-900/80">
                “{sc.get("home.about.quote")}”
                <footer className="mt-2 text-sm font-semibold not-italic text-brand-700">
                  — {sc.get("home.about.founder")}
                </footer>
              </blockquote>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {aboutCards.map((item) => (
                <div
                  key={item.t}
                  className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm"
                >
                  <h3 className="font-semibold text-brand-800">{item.t}</h3>
                  <p className="mt-1.5 text-sm text-brand-900/65">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Programs / What we do ---------- */}
        <section id="programs" className="bg-brand-50/60 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">
                {sc.get("home.programs.eyebrow")}
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
                {sc.get("home.programs.title")}
              </h2>
              <p className="mt-4 text-lg text-brand-900/70">
                {sc.get("home.programs.intro")}
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {programs.map((p) => (
                <div
                  key={p.key}
                  className="flex flex-col rounded-3xl border border-brand-100 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-700">
                    <ProgramIcon program={p.key} />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-brand-900">
                    {p.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-brand-900/70">
                    {p.description}
                  </p>
                  {p.key === "EMPOWERMENT" ? (
                    <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand-900/50">
                      For members only · apply from your dashboard
                    </span>
                  ) : (
                    <Link
                      href={`/apply?program=${p.key}`}
                      className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900"
                    >
                      Apply for {p.title}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Gallery ---------- */}
        <GallerySection
          albums={albums}
          photos={photos}
          limit={6}
          headingEyebrow={sc.get("gallery.hero.eyebrow")}
          headingTitle={sc.get("gallery.hero.title")}
          headingSubtitle={sc.get("gallery.hero.subtitle")}
        />

        {/* ---------- Donation ---------- */}
        <section className="bg-brand-950 py-20 text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 md:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-crimson-400 ring-1 ring-white/10">
                <HeartHandshake className="h-7 w-7" aria-hidden />
              </div>
              <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-brand-300">{sc.get("home.donate.eyebrow")}</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{sc.get("home.donate.title")}</h2>
              <p className="mt-4 max-w-2xl leading-relaxed text-brand-200">
                {sc.get("home.donate.text")}
              </p>
            </div>
            <div className="rounded-3xl bg-white p-7 text-brand-950 shadow-xl">
              <h3 className="text-xl font-bold">{sc.get("home.donate.cardTitle")}</h3>
              <p className="mt-3 text-sm leading-relaxed text-brand-900/65">{sc.get("home.donate.cardText")}</p>
              <Link href="/donate" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-crimson-600 px-6 py-3.5 font-semibold text-white transition hover:bg-crimson-700">
                Make a secure donation <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <p className="mt-3 text-center text-xs text-brand-900/45">Payments are processed securely by Paystack.</p>
            </div>
          </div>
        </section>

        {/* ---------- Membership CTA ---------- */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-8 py-14 text-white sm:px-14">
            <div className="grid items-center gap-8 md:grid-cols-[1.5fr_1fr]">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {sc.get("home.member.title")}
                </h2>
                <p className="mt-4 max-w-xl text-brand-100">
                  {sc.get("home.member.text")}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  href="/register"
                  className="rounded-full bg-white px-6 py-3.5 text-center font-semibold text-brand-800 transition hover:bg-brand-50"
                >
                  Create your member account
                </Link>
                <Link
                  href="/login"
                  className="rounded-full px-6 py-3.5 text-center font-semibold text-white ring-1 ring-white/40 transition hover:bg-white/10"
                >
                  I already have an account
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Apply CTA band ---------- */}
        <section className="border-t border-brand-100 bg-brand-50">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">
              {sc.get("home.apply.title")}
            </h2>
            <p className="max-w-2xl text-brand-900/70">
              {sc.get("home.apply.text")}
            </p>
            <Link
              href="/apply"
              className="rounded-full bg-brand-700 px-8 py-3.5 font-semibold text-white shadow-sm transition hover:bg-brand-800"
            >
              Apply for a program
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
