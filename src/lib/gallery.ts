import { prisma } from "@/lib/db";
import { GALLERY } from "@/lib/content";
import { LEGACY_GALLERY_IMAGES } from "@/lib/legacyImages";

export type GalleryDTO = { id: string; category: string; caption: string; src: string };

/** Active gallery images for the public site. Falls back to demo images until
 *  the Administrator has uploaded real ones. */
export async function getGalleryItems(): Promise<GalleryDTO[]> {
  const imgs = await prisma.galleryImage.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  if (imgs.length > 0) {
    return imgs.map((g) => ({ id: g.id, category: g.category, caption: g.caption, src: `/api/gallery/${g.id}` }));
  }
  if (LEGACY_GALLERY_IMAGES.length > 0) {
    return LEGACY_GALLERY_IMAGES.map((g) => ({ id: g.id, category: g.category, caption: g.caption, src: g.src }));
  }
  return GALLERY.map((g) => ({
    id: g.id,
    category: g.category,
    caption: g.caption,
    src: `https://picsum.photos/seed/${g.seed}/640/480`,
  }));
}
