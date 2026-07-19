"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { saveUpload } from "@/lib/uploads";

export type TeamState = { ok?: boolean; error?: string } | null;

async function requireAdmin() {
  const me = await getCurrentUser();
  if (!me || !(me.role === ROLES.ADMIN || me.role === ROLES.EXECUTIVE)) redirect("/dashboard");
  return me;
}

/** The About page and its cached homepage/dashboard views. */
function revalidateTeam() {
  revalidatePath("/dashboard/team");
  revalidatePath("/about");
}

const schema = z.object({
  name: z.string().trim().min(2, "Enter the person's name."),
  role: z.string().trim().min(2, "Enter their role or title."),
  bio: z.string().trim().max(400, "Keep the description under 400 characters.").optional(),
});

export async function createTeamMember(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const me = await requireAdmin();
  const parsed = schema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    bio: formData.get("bio") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  // The portrait is optional — cards fall back to the person's initials.
  let image: { storedName: string; mimeType: string } | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const res = await saveUpload(file, { imagesOnly: true });
    if (!res.ok) return { error: res.error };
    image = { storedName: res.file.storedName, mimeType: res.file.mimeType };
  }

  const max = await prisma.teamMember.aggregate({ _max: { order: true } });
  await prisma.teamMember.create({
    data: {
      name: parsed.data.name,
      role: parsed.data.role,
      bio: parsed.data.bio,
      storedName: image?.storedName,
      mimeType: image?.mimeType,
      order: (max._max.order ?? 0) + 1,
    },
  });
  await prisma.activityLog.create({
    data: { userId: me.id, action: "TEAM_MEMBER_ADDED", detail: `${parsed.data.name} — ${parsed.data.role}` },
  });
  revalidateTeam();
  return { ok: true };
}

export async function updateTeamMember(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const me = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.teamMember.findUnique({ where: { id } });
  if (!existing) return { error: "That team member no longer exists." };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    bio: formData.get("bio") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  // Only replace the stored portrait when a new file is actually uploaded.
  let image: { storedName: string; mimeType: string } | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const res = await saveUpload(file, { imagesOnly: true });
    if (!res.ok) return { error: res.error };
    image = { storedName: res.file.storedName, mimeType: res.file.mimeType };
  }

  await prisma.teamMember.update({
    where: { id },
    data: {
      name: parsed.data.name,
      role: parsed.data.role,
      bio: parsed.data.bio ?? null,
      ...(image ? { storedName: image.storedName, mimeType: image.mimeType } : {}),
    },
  });
  await prisma.activityLog.create({
    data: { userId: me.id, action: "TEAM_MEMBER_UPDATED", detail: `${parsed.data.name} — ${parsed.data.role}` },
  });
  revalidateTeam();
  return { ok: true };
}

export async function toggleTeamMember(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  const active = String(formData.get("active")) === "true";
  const member = await prisma.teamMember.update({ where: { id }, data: { active } });
  await prisma.activityLog.create({
    data: { userId: me.id, action: active ? "TEAM_MEMBER_SHOWN" : "TEAM_MEMBER_HIDDEN", detail: member.name },
  });
  revalidateTeam();
}

export async function deleteTeamMember(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  const member = await prisma.teamMember.delete({ where: { id } });
  await prisma.activityLog.create({
    data: { userId: me.id, action: "TEAM_MEMBER_REMOVED", detail: member.name },
  });
  revalidateTeam();
}

/** Moves a card one place up or down in the public ordering. */
export async function moveTeamMember(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const direction = String(formData.get("direction"));
  const member = await prisma.teamMember.findUnique({ where: { id } });
  if (!member) return;

  const neighbour = await prisma.teamMember.findFirst({
    where:
      direction === "up"
        ? { order: { lt: member.order } }
        : { order: { gt: member.order } },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return;

  await prisma.$transaction([
    prisma.teamMember.update({ where: { id: member.id }, data: { order: neighbour.order } }),
    prisma.teamMember.update({ where: { id: neighbour.id }, data: { order: member.order } }),
  ]);
  revalidateTeam();
}
