"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { saveUpload } from "@/lib/uploads";
import { LEGACY_GALLERY_IMAGES } from "@/lib/legacyImages";

export type GalleryState = { ok?: boolean; error?: string } | null;

async function requireAdmin() {
  const me = await getCurrentUser();
  if (!me || !(me.role === ROLES.ADMIN || me.role === ROLES.EXECUTIVE)) redirect("/dashboard");
  return me;
}

const schema = z.object({
  category: z.enum(["EMPOWERMENT", "ORPHANAGE", "SCHOLARSHIP", "EVENTS"], { message: "Choose a category." }),
  caption: z.string().trim().min(2, "Enter a caption."),
});

export async function uploadGalleryImage(_prev: GalleryState, formData: FormData): Promise<GalleryState> {
  const me = await requireAdmin();
  const parsed = schema.safeParse({ category: formData.get("category"), caption: formData.get("caption") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Please choose an image to upload." };
  const res = await saveUpload(file, { imagesOnly: true });
  if (!res.ok) return { error: res.error };

  const max = await prisma.galleryImage.aggregate({ where: { category: parsed.data.category }, _max: { order: true } });
  await prisma.galleryImage.create({
    data: {
      category: parsed.data.category,
      caption: parsed.data.caption,
      storedName: res.file.storedName,
      mimeType: res.file.mimeType,
      size: res.file.size,
      order: (max._max.order ?? 0) + 1,
    },
  });
  await prisma.activityLog.create({ data: { userId: me.id, action: "GALLERY_IMAGE_ADDED", detail: `${parsed.data.category}: ${parsed.data.caption}` } });
  revalidatePath("/dashboard/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
  return { ok: true };
}

const albumSchema = z.object({
  title: z.string().trim().min(2, "Enter an album title."),
  category: z.enum(["EMPOWERMENT", "ORPHANAGE", "SCHOLARSHIP", "EVENTS"], { message: "Choose a category." }),
  publishedAt: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), "Enter a valid publication date."),
  draft: z.boolean(),
});
const MAX_ALBUM_IMAGES = 20;
const MAX_ALBUM_BYTES = 80 * 1024 * 1024;

/** Creates an album and uploads its photos in one step. */
export async function createAlbum(_prev: GalleryState, formData: FormData): Promise<GalleryState> {
  const me = await requireAdmin();
  const parsed = albumSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    publishedAt: formData.get("publishedAt") || undefined,
    draft: formData.get("draft") === "on" || formData.get("draft") === "true",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const parsedDate = parsed.data.publishedAt ? new Date(`${parsed.data.publishedAt}T00:00:00.000Z`) : null;
  if (
    parsedDate
    && (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== parsed.data.publishedAt)
  ) {
    return { error: "Enter a valid publication date." };
  }

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "Add at least one photo to the album." };
  if (files.length > MAX_ALBUM_IMAGES) return { error: `An album can contain up to ${MAX_ALBUM_IMAGES} photos.` };
  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  if (totalBytes > MAX_ALBUM_BYTES) return { error: "The album is too large. Keep the combined photos below 80MB." };
  const captions = formData.getAll("captions").map((caption) => String(caption).trim());
  if (captions.length !== files.length) return { error: "Add a caption for every photo." };
  const emptyCaption = captions.findIndex((caption) => caption.length < 2);
  if (emptyCaption !== -1) return { error: `Enter a caption for photo ${emptyCaption + 1}.` };

  // Validate and save every file before writing anything to the database.
  const saved: { storedName: string; mimeType: string; size: number }[] = [];
  for (const file of files) {
    const res = await saveUpload(file, { imagesOnly: true });
    if (!res.ok) return { error: res.error };
    saved.push({ storedName: res.file.storedName, mimeType: res.file.mimeType, size: res.file.size });
  }

  const maxAlbum = await prisma.album.aggregate({ where: { category: parsed.data.category }, _max: { order: true } });
  const publishedAt = parsedDate ?? (parsed.data.draft ? null : new Date());

  await prisma.album.create({
    data: {
      title: parsed.data.title,
      category: parsed.data.category,
      draft: parsed.data.draft,
      publishedAt,
      order: (maxAlbum._max.order ?? 0) + 1,
      images: {
        create: saved.map((s, i) => ({
          category: parsed.data.category,
          caption: captions[i],
          storedName: s.storedName,
          mimeType: s.mimeType,
          size: s.size,
          order: i,
        })),
      },
    },
  });

  await prisma.activityLog.create({ data: { userId: me.id, action: "GALLERY_ALBUM_CREATED", detail: `${parsed.data.category}: ${parsed.data.title} (${saved.length} photos)` } });
  revalidatePath("/dashboard/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteAlbum(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  // Removing the album removes its photos too (an album is a unit).
  await prisma.galleryImage.deleteMany({ where: { albumId: id } });
  await prisma.album.delete({ where: { id } });
  await prisma.activityLog.create({ data: { userId: me.id, action: "GALLERY_ALBUM_DELETED", detail: id } });
  revalidatePath("/dashboard/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
}

/** Publish a draft album, or move a published album back to draft. */
export async function toggleAlbumDraft(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  const draft = String(formData.get("draft")) === "true";
  const existing = await prisma.album.findUnique({ where: { id }, select: { publishedAt: true } });
  await prisma.album.update({
    where: { id },
    data: {
      draft,
      // Stamp a publish date the first time it goes live.
      ...(!draft && existing && !existing.publishedAt ? { publishedAt: new Date() } : {}),
    },
  });
  await prisma.activityLog.create({ data: { userId: me.id, action: draft ? "GALLERY_ALBUM_DRAFTED" : "GALLERY_ALBUM_PUBLISHED", detail: id } });
  revalidatePath("/dashboard/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
}

export async function deleteGalleryImage(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.galleryImage.delete({ where: { id } });
  await prisma.activityLog.create({ data: { userId: me.id, action: "GALLERY_IMAGE_DELETED", detail: id } });
  revalidatePath("/dashboard/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
}

export async function toggleGalleryImage(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  const active = String(formData.get("active")) === "true";
  await prisma.galleryImage.update({ where: { id }, data: { active } });
  await prisma.activityLog.create({ data: { userId: me.id, action: active ? "GALLERY_IMAGE_SHOWN" : "GALLERY_IMAGE_HIDDEN", detail: id } });
  revalidatePath("/dashboard/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
}

export async function importLegacyGalleryImages() {
  const me = await requireAdmin();
  let imported = 0;

  for (const item of LEGACY_GALLERY_IMAGES) {
    const existing = await prisma.galleryImage.findFirst({
      where: { storedName: item.src },
      select: { id: true },
    });
    if (existing) continue;

    const max = await prisma.galleryImage.aggregate({ where: { category: item.category }, _max: { order: true } });
    await prisma.galleryImage.create({
      data: {
        category: item.category,
        caption: item.caption,
        storedName: item.src,
        mimeType: item.mimeType,
        order: (max._max.order ?? 0) + 1,
      },
    });
    imported++;
  }

  await prisma.activityLog.create({
    data: { userId: me.id, action: "GALLERY_LEGACY_IMPORTED", detail: `${imported} images imported from old website` },
  });
  revalidatePath("/dashboard/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
}
