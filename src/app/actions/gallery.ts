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
