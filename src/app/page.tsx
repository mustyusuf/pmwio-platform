import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { GallerySection } from "@/components/GallerySection";
import { getGalleryItems } from "@/lib/gallery";
import { ORG, PROGRAMS, IMPACT_STATS } from "@/lib/content";

export default async function HomePage() {
  const galleryItems = await getGalleryItems();
  return (
    <>
      <SiteHeader />
      <main>
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 text-white">
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
              A global Islamic NGO · Members across 4 continents
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Together, we can build a world where every woman and child can{" "}
              <span className="text-crimson-400">thrive</span>.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-brand-100">
              {ORG.blurb}
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
            {IMPACT_STATS.map((s) => (
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
                Who we are
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
                Faith in action, across the world.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-brand-900/75">
                Pious Muslim Women International Organization unites women of
                faith to care for the vulnerable. Guided by compassion and
                rooted in our values, we find and fund those in need, provide
                care, educate the next generation, and empower women to stand on
                their own.
              </p>
              <blockquote className="mt-6 border-l-4 border-crimson-500 pl-4 italic text-brand-900/80">
                “We believe every child deserves love, care, and the opportunity
                to thrive — regardless of their circumstances.”
                <footer className="mt-2 text-sm font-semibold not-italic text-brand-700">
                  — Prof. H. T. Yusuf, Founder
                </footer>
              </blockquote>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { t: "Find & Fund", d: "We locate the most vulnerable and raise the resources to help." },
                { t: "Provide Care", d: "Shelter, nutrition and healthcare for orphans and widows." },
                { t: "We Educate", d: "Scholarships and learning materials for needy students." },
                { t: "We Empower", d: "Skills and capital so women can build a future." },
              ].map((item) => (
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
                What we do
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
                Three ways we change lives
              </h2>
              <p className="mt-4 text-lg text-brand-900/70">
                Every program is open for applications from the public — anyone
                in need can reach out for support.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {PROGRAMS.map((p) => (
                <div
                  key={p.key}
                  className="flex flex-col rounded-3xl border border-brand-100 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-3xl">
                    {p.icon}
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
                      <span aria-hidden>→</span>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Gallery ---------- */}
        <GallerySection items={galleryItems.slice(0, 8)} />

        {/* ---------- Membership CTA ---------- */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-8 py-14 text-white sm:px-14">
            <div className="grid items-center gap-8 md:grid-cols-[1.5fr_1fr]">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Join a global sisterhood of changemakers
                </h2>
                <p className="mt-4 max-w-xl text-brand-100">
                  Register as a member to get your own dashboard and a unique{" "}
                  <strong className="text-crimson-400">User ID</strong> (your
                  Referee ID). Applicants name you as their referee when they
                  apply — so you can track the people you bring into the cause.
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
              Need support? You don&apos;t have to be a member to apply.
            </h2>
            <p className="max-w-2xl text-brand-900/70">
              Whether you&apos;re seeking empowerment, care for an orphan, or a
              scholarship for a brilliant student, our application takes just a
              few minutes. You&apos;ll need a member&apos;s Referee ID to apply.
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
