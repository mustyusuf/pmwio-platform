import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarketingHero } from "@/components/MarketingHero";
import { GallerySection } from "@/components/GallerySection";
import { getGalleryData } from "@/lib/gallery";
import { loadSiteContent } from "@/lib/content-store";

// Reads gallery items from the database, so render at request time rather than
// statically at build time (the DB does not exist during the Docker build).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from our empowerment, orphanage, scholarship and community work.",
};

export default async function GalleryPage() {
  const { albums, photos } = await getGalleryData();
  const sc = await loadSiteContent();
  return (
    <>
      <SiteHeader />
      <MarketingHero
        eyebrow={sc.get("gallery.hero.eyebrow")}
        title={sc.get("gallery.hero.title")}
        subtitle={sc.get("gallery.hero.subtitle")}
      />
      <main className="py-12">
        <GallerySection albums={albums} photos={photos} heading={false} background={false} />
      </main>
      <SiteFooter />
    </>
  );
}
