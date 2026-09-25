"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { saveUpload } from "@/lib/uploads";

export type PartnerState = { ok?: boolean; error?: string } | null;

async function requireAdmin() {
  const me = await getCurrentUser();
  if (!me || !(me.role === ROLES.ADMIN || me.role === ROLES.EXECUTIVE)) redirect("/dashboard");
  return me;
}

/** The Orphanage page and its admin list. */
function revalidatePartners() {
  revalidatePath("/dashboard/partners");
  revalidatePath("/orphanage");
}

const schema = z.object({
  name: z.string().trim().min(2, "Enter the organization or supporter's name."),
  url: z.string().trim().url("Enter a valid URL, or leave it blank.").optional().or(z.literal("")),
  kind: z.enum(["PARTNER", "SUPPORTER"]),
});

export async function createPartner(_prev: PartnerState, formData: FormData): Promise<PartnerState> {
  const me = await requireAdmin();
  const parsed = schema.safeParse({
    name: formData.get("name"),
    url: formData.get("url") || undefined,
    kind: formData.get("kind"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  // The logo is optional — cards fall back to the name's initials.
  let logo: { storedName: string; mimeType: string } | null = null;
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    const res = await saveUpload(file, { imagesOnly: true });
    if (!res.ok) return { error: res.error };
    logo = { storedName: res.file.storedName, mimeType: res.file.mimeType };
  }

  const max = await prisma.partner.aggregate({ _max: { order: true } });
  await prisma.partner.create({
    data: {
      name: parsed.data.name,
      url: parsed.data.url || null,
      kind: parsed.data.kind,
      storedName: logo?.storedName,
      mimeType: logo?.mimeType,
      order: (max._max.order ?? 0) + 1,
    },
  });
  await prisma.activityLog.create({
    data: { userId: me.id, action: "PARTNER_ADDED", detail: `${parsed.data.name} (${parsed.data.kind})` },
  });
  revalidatePartners();
  return { ok: true };
}

export async function updatePartner(_prev: PartnerState, formData: FormData): Promise<PartnerState> {
  const me = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.partner.findUnique({ where: { id } });
  if (!existing) return { error: "That entry no longer exists." };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    url: formData.get("url") || undefined,
    kind: formData.get("kind"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  // Only replace the stored logo when a new file is actually uploaded.
  let logo: { storedName: string; mimeType: string } | null = null;
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    const res = await saveUpload(file, { imagesOnly: true });
    if (!res.ok) return { error: res.error };
    logo = { storedName: res.file.storedName, mimeType: res.file.mimeType };
  }

  await prisma.partner.update({
    where: { id },
    data: {
      name: parsed.data.name,
      url: parsed.data.url || null,
      kind: parsed.data.kind,
      ...(logo ? { storedName: logo.storedName, mimeType: logo.mimeType } : {}),
    },
  });
  await prisma.activityLog.create({
    data: { userId: me.id, action: "PARTNER_UPDATED", detail: `${parsed.data.name} (${parsed.data.kind})` },
  });
  revalidatePartners();
  return { ok: true };
}

export async function togglePartner(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  const active = String(formData.get("active")) === "true";
  const partner = await prisma.partner.update({ where: { id }, data: { active } });
  await prisma.activityLog.create({
    data: { userId: me.id, action: active ? "PARTNER_SHOWN" : "PARTNER_HIDDEN", detail: partner.name },
  });
  revalidatePartners();
}

export async function deletePartner(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  const partner = await prisma.partner.delete({ where: { id } });
  await prisma.activityLog.create({
    data: { userId: me.id, action: "PARTNER_REMOVED", detail: partner.name },
  });
  revalidatePartners();
}

/** Moves a card one place up or down, within its own kind (Partner/Supporter). */
export async function movePartner(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const direction = String(formData.get("direction"));
  const partner = await prisma.partner.findUnique({ where: { id } });
  if (!partner) return;

  const neighbour = await prisma.partner.findFirst({
    where: {
      kind: partner.kind,
      order: direction === "up" ? { lt: partner.order } : { gt: partner.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return;

  await prisma.$transaction([
    prisma.partner.update({ where: { id: partner.id }, data: { order: neighbour.order } }),
    prisma.partner.update({ where: { id: neighbour.id }, data: { order: partner.order } }),
  ]);
  revalidatePartners();
}
