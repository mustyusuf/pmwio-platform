"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { saveUpload } from "@/lib/uploads";
import { CONTENT_FIELDS } from "@/lib/siteContent";

export type ContentState = { ok?: boolean; error?: string } | null;

async function requireAdmin() {
  const me = await getCurrentUser();
  if (!me || !(me.role === ROLES.ADMIN || me.role === ROLES.EXECUTIVE)) redirect("/dashboard");
  return me;
}

function refreshSite() {
  // Refresh every page rendered under the root layout (public site + footer).
  revalidatePath("/", "layout");
}

/** Saves all editable text fields. Clearing a field reverts it to the default. */
export async function saveSiteContent(_prev: ContentState, formData: FormData): Promise<ContentState> {
  const me = await requireAdmin();

  for (const field of CONTENT_FIELDS) {
    if (field.type === "image") continue;
    const raw = formData.get(field.key);
    if (raw === null) continue; // field not present in this submission
    const value = String(raw).trim();
    if (value === "") {
      await prisma.siteContent.deleteMany({ where: { key: field.key } });
    } else {
      await prisma.siteContent.upsert({
        where: { key: field.key },
        create: { key: field.key, value, type: field.type },
        update: { value, type: field.type },
      });
    }
  }

  await prisma.activityLog.create({ data: { userId: me.id, action: "SITE_CONTENT_UPDATED", detail: "Edited site content" } });
  refreshSite();
  return { ok: true };
}

/** Uploads an image for an image-type content field. */
export async function uploadContentImage(_prev: ContentState, formData: FormData): Promise<ContentState> {
  const me = await requireAdmin();
  const key = String(formData.get("key") ?? "");
  const field = CONTENT_FIELDS.find((f) => f.key === key && f.type === "image");
  if (!field) return { error: "Unknown image field." };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Please choose an image to upload." };
  const res = await saveUpload(file, { imagesOnly: true });
  if (!res.ok) return { error: res.error };

  await prisma.siteContent.upsert({
    where: { key },
    create: { key, value: res.file.storedName, type: "image" },
    update: { value: res.file.storedName, type: "image" },
  });
  await prisma.activityLog.create({ data: { userId: me.id, action: "SITE_CONTENT_IMAGE_UPLOADED", detail: key } });
  refreshSite();
  return { ok: true };
}

/** Removes an uploaded content image (reverts to no image). */
export async function removeContentImage(formData: FormData) {
  const me = await requireAdmin();
  const key = String(formData.get("key") ?? "");
  await prisma.siteContent.deleteMany({ where: { key, type: "image" } });
  await prisma.activityLog.create({ data: { userId: me.id, action: "SITE_CONTENT_IMAGE_REMOVED", detail: key } });
  refreshSite();
}
