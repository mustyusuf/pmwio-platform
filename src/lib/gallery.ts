import { prisma } from "@/lib/db";
import { GALLERY } from "@/lib/content";
import { LEGACY_GALLERY_IMAGES } from "@/lib/legacyImages";

export type GalleryPhotoDTO = { id: string; category: string; caption: string; src: string };
export type GalleryAlbumDTO = {
  id: string;
  category: string;
  title: string;
  publishedAt: string | null; // ISO string, formatted in the UI
  cover: string;
  count: number;
  images: { id: string; caption: string; src: string }[];
};
export type GalleryData = { albums: GalleryAlbumDTO[]; photos: GalleryPhotoDTO[] };

/** Backwards-compatible alias for the loose-photo shape. */
export type GalleryDTO = GalleryPhotoDTO;

/** Albums (published only) and loose photos for the public site. Falls back to
 *  demo/legacy images as loose photos until real content has been uploaded. */
export async function getGalleryData(): Promise<GalleryData> {
  const [albumRows, looseImgs] = await Promise.all([
    prisma.album.findMany({
      where: { draft: false },
      orderBy: [{ order: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      include: {
        images: {
          where: { active: true },
          orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        },
      },
    }),
    prisma.galleryImage.findMany({
      where: { active: true, albumId: null },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const albums: GalleryAlbumDTO[] = albumRows
    .filter((a) => a.images.length > 0) // hide empty albums from the public
    .map((a) => ({
      id: a.id,
      category: a.category,
      title: a.title,
      publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
      cover: `/api/gallery/${a.images[0].id}`,
      count: a.images.length,
      images: a.images.map((g) => ({ id: g.id, caption: g.caption, src: `/api/gallery/${g.id}` })),
    }));

  const photos: GalleryPhotoDTO[] = looseImgs.map((g) => ({
    id: g.id,
    category: g.category,
    caption: g.caption,
    src: `/api/gallery/${g.id}`,
  }));

  // Only fall back to demo content when nothing at all has been published.
  if (albums.length === 0 && photos.length === 0) {
    if (LEGACY_GALLERY_IMAGES.length > 0) {
      return {
        albums: [],
        photos: LEGACY_GALLERY_IMAGES.map((g) => ({ id: g.id, category: g.category, caption: g.caption, src: g.src })),
      };
    }
    return {
      albums: [],
      photos: GALLERY.map((g) => ({
        id: g.id,
        category: g.category,
        caption: g.caption,
        src: `https://picsum.photos/seed/${g.seed}/640/480`,
      })),
    };
  }

  return { albums, photos };
}
