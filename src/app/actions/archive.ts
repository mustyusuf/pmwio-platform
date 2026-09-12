"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { saveAudioUpload, saveUpload } from "@/lib/uploads";

export type ArchiveState = { ok?: boolean; error?: string } | null;

async function requireAdmin() {
  const me = await getCurrentUser();
  if (!me || !(me.role === ROLES.ADMIN || me.role === ROLES.EXECUTIVE)) redirect("/dashboard");
  return me;
}

/** The admin list and the public archive page. */
function revalidateArchive() {
  revalidatePath("/dashboard/archive");
  revalidatePath("/archive");
}

const CATEGORY = z.enum(["LECTURE", "SERMON", "EVENT", "OTHER"], { message: "Choose a category." });
const MEDIA_TYPE = z.enum(["VIDEO_LINK", "AUDIO_LINK", "AUDIO_FILE"], { message: "Choose a media type." });

const schema = z.object({
  title: z.string().trim().min(2, "Enter a title."),
  topic: z.string().trim().max(200, "Keep the topic under 200 characters.").optional(),
  lecturer: z.string().trim().max(200, "Keep the lecturer name under 200 characters.").optional(),
  description: z.string().trim().max(1000, "Keep the description under 1000 characters.").optional(),
  category: CATEGORY,
  mediaType: MEDIA_TYPE,
  eventDate: z.string().trim().optional(),
});

export async function createArchiveItem(_prev: ArchiveState, formData: FormData): Promise<ArchiveState> {
  const me = await requireAdmin();
  const parsed = schema.safeParse({
    title: formData.get("title"),
    topic: formData.get("topic") || undefined,
    lecturer: formData.get("lecturer") || undefined,
    description: formData.get("description") || undefined,
    category: formData.get("category"),
    mediaType: formData.get("mediaType"),
    eventDate: formData.get("eventDate") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  let eventDate: Date | null = null;
  if (parsed.data.eventDate) {
    const d = new Date(parsed.data.eventDate);
    if (Number.isNaN(d.getTime())) return { error: "Enter a valid event date." };
    eventDate = d;
  }

  let url: string | null = null;
  let storedName: string | null = null;
  let mimeType: string | null = null;
  let size: number | null = null;

  if (parsed.data.mediaType === "VIDEO_LINK" || parsed.data.mediaType === "AUDIO_LINK") {
    const raw = String(formData.get("url") ?? "").trim();
    const urlCheck = z.string().url().safeParse(raw);
    if (!urlCheck.success) return { error: "Enter a valid link (starting with https://)." };
    url = urlCheck.data;
  } else {
    const file = formData.get("audio");
    if (!(file instanceof File) || file.size === 0) return { error: "Choose an audio file to upload." };
    const res = await saveAudioUpload(file);
    if (!res.ok) return { error: res.error };
    storedName = res.file.storedName;
    mimeType = res.file.mimeType;
    size = res.file.size;
  }

  let imageStoredName: string | null = null;
  let imageMimeType: string | null = null;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const res = await saveUpload(image, { imagesOnly: true });
    if (!res.ok) return { error: res.error };
    imageStoredName = res.file.storedName;
    imageMimeType = res.file.mimeType;
  }

  await prisma.archiveItem.create({
    data: {
      title: parsed.data.title,
      topic: parsed.data.topic || null,
      lecturer: parsed.data.lecturer || null,
      description: parsed.data.description || null,
      category: parsed.data.category,
      mediaType: parsed.data.mediaType,
      url,
      storedName,
      mimeType,
      size,
      imageStoredName,
      imageMimeType,
      eventDate,
      createdById: me.id,
      publishedAt: formData.get("publish") === "true" ? new Date() : null,
    },
  });
  await prisma.activityLog.create({
    data: { userId: me.id, action: "ARCHIVE_ITEM_ADDED", detail: parsed.data.title },
  });
  revalidateArchive();
  return { ok: true };
}

export async function toggleArchivePublish(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  const publish = String(formData.get("publish")) === "true";
  const item = await prisma.archiveItem.update({
    where: { id },
    data: { publishedAt: publish ? new Date() : null },
  });
  await prisma.activityLog.create({
    data: { userId: me.id, action: publish ? "ARCHIVE_ITEM_PUBLISHED" : "ARCHIVE_ITEM_UNPUBLISHED", detail: item.title },
  });
  revalidateArchive();
}

export async function deleteArchiveItem(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  const item = await prisma.archiveItem.delete({ where: { id } });
  await prisma.activityLog.create({
    data: { userId: me.id, action: "ARCHIVE_ITEM_REMOVED", detail: item.title },
  });
  revalidateArchive();
}
