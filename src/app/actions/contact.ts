"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/roles";

export type ContactState = { ok?: boolean; error?: string } | null;

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  email: z.email("Enter a valid email address."),
  subject: z.string().trim().optional(),
  message: z.string().trim().min(10, "Please write a longer message."),
});

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject") || undefined,
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const d = parsed.data;

  await prisma.activityLog.create({
    data: { action: "CONTACT_MESSAGE", detail: `${d.name} <${d.email}>${d.subject ? ` · ${d.subject}` : ""}: ${d.message.slice(0, 200)}` },
  });

  // Notify administrators and executives.
  const admins = await prisma.user.findMany({
    where: { active: true, role: { in: [ROLES.ADMIN, ROLES.EXECUTIVE] } },
    select: { id: true },
  });
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({ userId: a.id, title: "New contact message", body: `${d.name} (${d.email})${d.subject ? ` — ${d.subject}` : ""}` })),
    });
  }
  return { ok: true };
}
