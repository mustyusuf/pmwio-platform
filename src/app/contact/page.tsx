import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarketingHero } from "@/components/MarketingHero";
import { ContactForm } from "@/components/forms/ContactForm";
import { loadSiteContent } from "@/lib/content-store";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Pious Muslim Women International Organization.",
};

export default async function ContactPage() {
  const sc = await loadSiteContent();
  const email = sc.get("org.email");
  const phone = sc.get("org.phone");
  return (
    <>
      <SiteHeader />
      <MarketingHero
        eyebrow={sc.get("contact.hero.eyebrow")}
        title={sc.get("contact.hero.title")}
        subtitle={sc.get("contact.hero.subtitle")}
      />
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-600">Reach us</h2>
              <ul className="mt-4 space-y-4 text-sm">
                <li>
                  <p className="font-semibold text-brand-900">Email</p>
                  <a href={`mailto:${email}`} className="text-brand-700 hover:underline">{email}</a>
                </li>
                <li>
                  <p className="font-semibold text-brand-900">Phone</p>
                  <a href={`tel:${phone.replace(/\s+/g, "")}`} className="text-brand-700 hover:underline">{phone}</a>
                </li>
                <li>
                  <p className="font-semibold text-brand-900">Address</p>
                  <p className="text-brand-900/70">{sc.get("org.address")}</p>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100">
              <p className="text-sm text-brand-900/75">{sc.get("contact.member.note")}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-brand-100 bg-white p-7 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-brand-950">{sc.get("contact.form.title")}</h2>
            <div className="mt-5"><ContactForm /></div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
