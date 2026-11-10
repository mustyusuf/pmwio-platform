"use server";

import { z } from "zod";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { verifyPassword, passwordUpdate, MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { allowFromIp, rateLimit, LIMITS, TOO_MANY } from "@/lib/rate-limit";
import { createSession } from "@/lib/session";
import { saveUpload } from "@/lib/uploads";
import { send, isEmailConfigured } from "@/lib/email";
import { passwordReset, passwordChanged } from "@/lib/email-templates";
import { createPasswordResetLink } from "@/lib/password-reset";

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
    next: z.string().min(MIN_PASSWORD_LENGTH, `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`).max(100, "Password is too long."),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { message: "New passwords do not match.", path: ["confirm"] });

export async function changePassword(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (!rateLimit(`password:${me.id}`, LIMITS.password.limit, LIMITS.password.windowMs)) return { error: TOO_MANY };

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
  await prisma.user.update({ where: { id: me.id }, data: await passwordUpdate(parsed.data.next) });
  await prisma.activityLog.create({ data: { userId: me.id, action: "PASSWORD_CHANGED", detail: me.email } });
  // Every other session is now revoked; give this one a fresh login so the person
  // who just changed their password isn't signed out of the device they used.
  await createSession({ sub: me.id, code: me.userId, name: me.name, role: me.role });

  // Email #8 (security confirmation).
  await send(fresh.email, passwordChanged(fresh.name));
  return { ok: true, message: "Password changed." };
}

// ---------- Forgot / reset password (token-based) ----------

export type ResetRequestState = { ok?: boolean; error?: string; resetUrl?: string } | null;

export async function requestPasswordReset(_prev: ResetRequestState, formData: FormData): Promise<ResetRequestState> {
  if (!(await allowFromIp("passwordReset"))) return { error: TOO_MANY };
  const identifier = String(formData.get("identifier") ?? "").trim();
  if (!identifier) return { error: "Enter your User ID or email." };

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier.toLowerCase() }, { userId: identifier.toUpperCase() }] },
  });
  // Always respond the same way to avoid leaking which accounts exist.
  if (!user) {
    return { ok: true };
  }

  // Email #7 (password reset link). Only in development, with no mail server,
  // is the link shown on-screen. In production it must NEVER be returned here:
  // anyone could then reset any account's password just by naming it.
  const resetUrl = await createPasswordResetLink(user.id);
  await send(user.email, passwordReset(user.name, resetUrl));
  return process.env.NODE_ENV !== "production" && !isEmailConfigured() ? { ok: true, resetUrl } : { ok: true };
}

const resetSchema = z
  .object({
    token: z.string().min(10),
    next: z.string().min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`).max(100, "Password is too long."),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { message: "Passwords do not match.", path: ["confirm"] });

export type ResetState = { ok?: boolean; error?: string } | null;

export async function resetPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  if (!(await allowFromIp("passwordReset"))) return { error: TOO_MANY };
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

  // Claim the token first so two simultaneous submissions can't both use it.
  const claimed = await prisma.passwordReset.updateMany({ where: { id: record.id, used: false }, data: { used: true } });
  if (claimed.count === 0) return { error: "This reset link is invalid or has expired. Please request a new one." };
  const updated = await prisma.user.update({ where: { id: record.userId }, data: await passwordUpdate(parsed.data.next) });
  // Any other reset links still outstanding for this account die with this one.
  await prisma.passwordReset.updateMany({ where: { userId: record.userId, used: false }, data: { used: true } });
  await prisma.activityLog.create({ data: { userId: record.userId, action: "PASSWORD_RESET", detail: "via reset link" } });

  // Email #8 (security confirmation).
  await send(updated.email, passwordChanged(updated.name));
  return { ok: true };
}
