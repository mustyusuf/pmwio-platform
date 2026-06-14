"use server";

import { z } from "zod";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { saveUpload } from "@/lib/uploads";

export type ProfileState = { ok?: boolean; error?: string; message?: string } | null;

const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name."),
  phone: z.string().trim().optional(),
  country: z.string().trim().optional(),
});

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    country: formData.get("country") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details." };

  let imagePath: string | undefined;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const res = await saveUpload(image, { imagesOnly: true });
    if (!res.ok) return { error: res.error };
    imagePath = res.file.storedName;
  }

  await prisma.user.update({
    where: { id: me.id },
    data: { name: parsed.data.name, phone: parsed.data.phone, country: parsed.data.country, ...(imagePath ? { imagePath } : {}) },
  });
  await prisma.activityLog.create({ data: { userId: me.id, action: "PROFILE_UPDATED", detail: me.email } });
  revalidatePath("/dashboard");
  return { ok: true, message: "Profile updated." };
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    next: z.string().min(6, "New password must be at least 6 characters."),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { message: "New passwords do not match.", path: ["confirm"] });

export async function changePassword(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const parsed = passwordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const fresh = await prisma.user.findUnique({ where: { id: me.id } });
  if (!fresh || !(await verifyPassword(parsed.data.current, fresh.passwordHash))) {
    return { error: "Your current password is incorrect." };
  }
  await prisma.user.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(parsed.data.next) } });
  await prisma.activityLog.create({ data: { userId: me.id, action: "PASSWORD_CHANGED", detail: me.email } });
  return { ok: true, message: "Password changed." };
}

// ---------- Forgot / reset password (token-based) ----------

export type ResetRequestState = { ok?: boolean; error?: string; resetUrl?: string } | null;

export async function requestPasswordReset(_prev: ResetRequestState, formData: FormData): Promise<ResetRequestState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  if (!identifier) return { error: "Enter your User ID or email." };

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier.toLowerCase() }, { userId: identifier.toUpperCase() }] },
  });
  // Always respond the same way to avoid leaking which accounts exist.
  if (!user) {
    return { ok: true };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await prisma.passwordReset.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 1000 * 60 * 30) }, // 30 min
  });

  // In production this link would be emailed. For this app we surface it directly.
  return { ok: true, resetUrl: `/reset-password?token=${token}` };
}

const resetSchema = z
  .object({
    token: z.string().min(10),
    next: z.string().min(6, "Password must be at least 6 characters."),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { message: "Passwords do not match.", path: ["confirm"] });

export type ResetState = { ok?: boolean; error?: string } | null;

export async function resetPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const record = await prisma.passwordReset.findFirst({
    where: { tokenHash, used: false, expiresAt: { gt: new Date() } },
  });
  if (!record) return { error: "This reset link is invalid or has expired. Please request a new one." };

  await prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(parsed.data.next) } });
  await prisma.passwordReset.update({ where: { id: record.id }, data: { used: true } });
  await prisma.activityLog.create({ data: { userId: record.userId, action: "PASSWORD_RESET", detail: "via reset link" } });
  return { ok: true };
}
