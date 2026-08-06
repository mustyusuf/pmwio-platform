import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarketingHero } from "@/components/MarketingHero";
import { ArchiveSection } from "@/components/ArchiveSection";
import { getArchiveData } from "@/lib/archive";
import { loadSiteContent } from "@/lib/content-store";

// Reads archive items from the database, so render at request time rather
// than statically at build time (the DB does not exist during the Docker build).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Archive",
  description: "Past lectures, sermons and events from the Pious Muslim Women International Organization.",
};

export default async function ArchivePage() {
  const items = await getArchiveData();
  const sc = await loadSiteContent();
  return (
    <>
      <SiteHeader />
      <MarketingHero
        eyebrow={sc.get("archive.hero.eyebrow")}
        title={sc.get("archive.hero.title")}
        subtitle={sc.get("archive.hero.subtitle")}
      />
      <main className="py-12">
        <ArchiveSection items={items} />
      </main>
      <SiteFooter />
    </>
  );
}
