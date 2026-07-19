"use server";

import crypto from "node:crypto";
import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword, generateUserId } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { send, link, recipientsByRole } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import { memberRegistrationPending, memberRegistrationAlert, verifyEmail } from "@/lib/email-templates";

export type AuthState = { error?: string; pending?: boolean } | null;

/**
 * Issues a fresh single-use email-verification token for a user and emails them
 * the confirmation link (#3). Any earlier unused tokens are invalidated so only
 * the latest link works. Best-effort: never throws.
 */
async function issueEmailVerification(user: { id: string; name: string; email: string }) {
  await prisma.emailVerification.updateMany({ where: { userId: user.id, used: false }, data: { used: true } });
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await prisma.emailVerification.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) }, // 24h
  });
  await send(user.email, verifyEmail(user.name, link(`/verify-email?token=${token}`)));
}

/** Find an unused public User ID, retrying on the rare chance of a collision. */
export async function uniqueUserId(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateUserId();
    const existing = await prisma.user.findUnique({ where: { userId: candidate } });
    if (!existing) return candidate;
  }
  throw new Error("Could not generate a unique User ID. Please try again.");
}

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name."),
    email: z.email("Enter a valid email address.").toLowerCase(),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string(),
    phone: z.string().trim().optional(),
    country: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    phone: formData.get("phone") || undefined,
    country: formData.get("country") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const { name, email, password, phone, country } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists. Please log in." };
  }

  // Public registration creates a Member / Referee account that stays locked
  // until the applicant confirms their email. Administrator validation happens
  // afterwards and does not block access.
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      phone,
      country,
      role: ROLES.MEMBER,
      userId: await uniqueUserId(),
      approved: false,
      emailVerified: false,
    },
  });

  await prisma.activityLog.create({
    data: { userId: user.id, action: "MEMBER_REGISTERED", detail: `${name} — awaiting email verification` },
  });

  // Email #3: confirm email ownership. Admins are only alerted once the email is
  // verified (see verifyEmailToken), so they never review unverified accounts.
  await issueEmailVerification(user);

  // Do NOT log them in — they must verify their email and then be approved.
  return { pending: true };
}

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your User ID or email."),
  password: z.string().min(1, "Please enter your password."),
});

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  // Sign in with User ID or email.
  const id = parsed.data.identifier;
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: id.toLowerCase() }, { userId: id.toUpperCase() }] },
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Incorrect User ID / email or password." };
  }
  if (!user.emailVerified) {
    return { error: "Please confirm your email address first. Check your inbox for the confirmation link, or request a new one at /verify-email." };
  }
  // Administrator approval is no longer a gate: confirming the email address is
  // enough to sign in. Admins validate members after the fact (see Settings).
  if (!user.active) {
    return { error: "This account has been disabled. Please contact the organization." };
  }

  await createSession({ sub: user.id, code: user.userId, name: user.name, role: user.role });
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

// ---------------------------------------------------------------------------
// Email verification (#3): confirm ownership before an admin reviews the member.
// ---------------------------------------------------------------------------

export type VerifyEmailResult =
  | { ok: true; alreadyVerified?: boolean }
  | { ok: false; error: string };

/** Confirm a verification token: marks the email verified and alerts admins. */
export async function verifyEmailToken(rawToken: string): Promise<VerifyEmailResult> {
  const token = rawToken?.trim();
  if (!token) return { ok: false, error: "This confirmation link is missing its token." };

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const record = await prisma.emailVerification.findFirst({
    where: { tokenHash, used: false, expiresAt: { gt: new Date() } },
    include: { user: true },
  });
  if (!record) {
    return { ok: false, error: "This confirmation link is invalid or has expired. Please request a new one." };
  }

  await prisma.emailVerification.update({ where: { id: record.id }, data: { used: true } });

  if (record.user.emailVerified) {
    return { ok: true, alreadyVerified: true };
  }

  await prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } });
  await prisma.activityLog.create({ data: { userId: record.userId, action: "EMAIL_VERIFIED", detail: record.user.email } });

  // Email #1 — the member can now sign in; no approval wait.
  await send(record.user.email, memberRegistrationPending(record.user.name));

  // Admin validation is an optional review queue. When the window is closed we
  // skip the notifications and staff alert entirely.
  const { memberValidationOpen } = await getSettings();
  if (memberValidationOpen) {
    const admins = await prisma.user.findMany({
      where: { active: true, role: { in: [ROLES.ADMIN, ROLES.EXECUTIVE] } },
      select: { id: true },
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          title: "New member to validate",
          body: `${record.user.name} confirmed their email and is awaiting validation.`,
        })),
      });
    }
    // Email #2 — staff alert prompting them to validate the new member.
    const staff = await recipientsByRole([ROLES.ADMIN, ROLES.EXECUTIVE]);
    if (staff.length > 0) await send(staff, memberRegistrationAlert(record.user.name, record.user.email));
  }

  return { ok: true };
}

export type ResendVerificationState = { ok?: boolean; error?: string } | null;

/** Re-send the verification link. Responds identically whether or not a matching
 *  unverified account exists, to avoid leaking which emails are registered. */
export async function resendVerification(_prev: ResendVerificationState, formData: FormData): Promise<ResendVerificationState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  if (!identifier) return { error: "Enter your User ID or email." };

  const user = await prisma.user.findFirst({
    where: {
      emailVerified: false,
      OR: [{ email: identifier.toLowerCase() }, { userId: identifier.toUpperCase() }],
    },
    select: { id: true, name: true, email: true },
  });
  if (user) await issueEmailVerification(user);

  return { ok: true };
}
