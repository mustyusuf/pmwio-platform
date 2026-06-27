"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { saveUpload } from "@/lib/uploads";

export type GalleryState = { ok?: boolean; error?: string } | null;

const CATEGORY = z.enum(["EMPOWERMENT", "ORPHANAGE", "SCHOLARSHIP", "EVENTS"], { message: "Choose a category." });
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ALBUM_IMAGES = 20;
const MAX_ALBUM_BYTES = 80 * 1024 * 1024;

function parseDate(value?: string): { ok: true; date: Date | null } | { ok: false } {
  if (!value) return { ok: true, date: null };
  if (!DATE_RE.test(value)) return { ok: false };
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) return { ok: false };
  return { ok: true, date: d };
}

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
  description: z.string().trim().optional(),
  category: CATEGORY,
  publishedAt: z.string().trim().optional(),
  draft: z.boolean(),
});

/** Saves a batch of uploaded image files (validated up-front). */
async function saveImageBatch(files: File[]): Promise<{ ok: true; saved: { storedName: string; mimeType: string; size: number }[] } | { ok: false; error: string }> {
  if (files.length === 0) return { ok: false, error: "Add at least one photo to the album." };
  if (files.length > MAX_ALBUM_IMAGES) return { ok: false, error: `An album can contain up to ${MAX_ALBUM_IMAGES} photos.` };
  if (files.reduce((t, f) => t + f.size, 0) > MAX_ALBUM_BYTES) return { ok: false, error: "The album is too large. Keep the combined photos below 80MB." };
  const saved: { storedName: string; mimeType: string; size: number }[] = [];
  for (const file of files) {
    const res = await saveUpload(file, { imagesOnly: true });
    if (!res.ok) return { ok: false, error: res.error };
    saved.push({ storedName: res.file.storedName, mimeType: res.file.mimeType, size: res.file.size });
  }
  return { ok: true, saved };
}

/** Creates an album and uploads its photos in one step. Captions are optional. */
export async function createAlbum(_prev: GalleryState, formData: FormData): Promise<GalleryState> {
  const me = await requireAdmin();
  const parsed = albumSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    category: formData.get("category"),
    publishedAt: formData.get("publishedAt") || undefined,
    draft: formData.get("draft") === "on" || formData.get("draft") === "true",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const dateResult = parseDate(parsed.data.publishedAt);
  if (!dateResult.ok) return { error: "Enter a valid publication date." };

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const batch = await saveImageBatch(files);
  if (!batch.ok) return { error: batch.error };

  // Captions are optional and align with the file order; empty ones become null.
  const captions = formData.getAll("captions").map((c) => String(c).trim());

  const maxAlbum = await prisma.album.aggregate({ where: { category: parsed.data.category }, _max: { order: true } });
  const publishedAt = dateResult.date ?? (parsed.data.draft ? null : new Date());

  await prisma.album.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      category: parsed.data.category,
      draft: parsed.data.draft,
      publishedAt,
      order: (maxAlbum._max.order ?? 0) + 1,
      images: {
        create: batch.saved.map((s, i) => ({
          category: parsed.data.category,
          caption: captions[i]?.length ? captions[i] : null,
          storedName: s.storedName,
          mimeType: s.mimeType,
          size: s.size,
          order: i,
        })),
      },
    },
  });

  await prisma.activityLog.create({ data: { userId: me.id, action: "GALLERY_ALBUM_CREATED", detail: `${parsed.data.category}: ${parsed.data.title} (${batch.saved.length} photos)` } });
  revalidatePath("/dashboard/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
  return { ok: true };
}

/** Edits an existing album's details (title, description, category, date, draft). */
export async function updateAlbum(_prev: GalleryState, formData: FormData): Promise<GalleryState> {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  const parsed = albumSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    category: formData.get("category"),
    publishedAt: formData.get("publishedAt") || undefined,
    draft: formData.get("draft") === "on" || formData.get("draft") === "true",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const dateResult = parseDate(parsed.data.publishedAt);
  if (!dateResult.ok) return { error: "Enter a valid publication date." };

  const existing = await prisma.album.findUnique({ where: { id }, select: { publishedAt: true } });
  if (!existing) return { error: "Album not found." };
  const publishedAt = dateResult.date ?? (parsed.data.draft ? existing.publishedAt : existing.publishedAt ?? new Date());

  await prisma.album.update({
    where: { id },
    data: { title: parsed.data.title, description: parsed.data.description || null, category: parsed.data.category, draft: parsed.data.draft, publishedAt },
  });
  await prisma.activityLog.create({ data: { userId: me.id, action: "GALLERY_ALBUM_UPDATED", detail: `${parsed.data.category}: ${parsed.data.title}` } });
  revalidatePath("/dashboard/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
  return { ok: true };
}

/** Appends more photos to an existing album. Captions optional. */
export async function addAlbumImages(_prev: GalleryState, formData: FormData): Promise<GalleryState> {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  const album = await prisma.album.findUnique({ where: { id }, select: { category: true } });
  if (!album) return { error: "Album not found." };

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const batch = await saveImageBatch(files);
  if (!batch.ok) return { error: batch.error };
  const captions = formData.getAll("captions").map((c) => String(c).trim());

  const max = await prisma.galleryImage.aggregate({ where: { albumId: id }, _max: { order: true } });
  let order = (max._max.order ?? -1) + 1;
  for (let i = 0; i < batch.saved.length; i++) {
    const s = batch.saved[i];
    await prisma.galleryImage.create({
      data: { albumId: id, category: album.category, caption: captions[i]?.length ? captions[i] : null, storedName: s.storedName, mimeType: s.mimeType, size: s.size, order: order++ },
    });
  }
  await prisma.activityLog.create({ data: { userId: me.id, action: "GALLERY_ALBUM_IMAGES_ADDED", detail: `${batch.saved.length} photos -> ${id}` } });
  revalidatePath("/dashboard/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
  return { ok: true };
}

/** Updates a single photo's caption (admin editing). */
export async function updateImageCaption(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const caption = String(formData.get("caption") ?? "").trim();
  await prisma.galleryImage.update({ where: { id }, data: { caption: caption.length ? caption : null } });
  revalidatePath("/dashboard/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
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

