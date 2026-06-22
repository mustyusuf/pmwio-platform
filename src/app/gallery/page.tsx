import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarketingHero } from "@/components/MarketingHero";
import { GallerySection } from "@/components/GallerySection";
import { getGalleryItems } from "@/lib/gallery";

// Reads gallery items from the database, so render at request time rather than
// statically at build time (the DB does not exist during the Docker build).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from our empowerment, orphanage, scholarship and community work.",
};

export default async function GalleryPage() {
  const items = await getGalleryItems();
  return (
    <>
      <SiteHeader />
      <MarketingHero
        eyebrow="Gallery"
        title="Moments from our work."
        subtitle="A glimpse of the lives we touch — filter by program to see more."
      />
      <main className="py-12">
        <GallerySection items={items} heading={false} background={false} />
      </main>
      <SiteFooter />
    </>
  );
}
