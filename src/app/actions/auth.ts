"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword, generateUserId } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";
import { ROLES } from "@/lib/roles";

export type AuthState = { error?: string; pending?: boolean } | null;

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

  // Public registration creates a Member / Referee account that stays inactive
  // until an administrator approves it (to verify they are a genuine member).
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
    },
  });

  await prisma.activityLog.create({
    data: { userId: user.id, action: "MEMBER_REGISTERED", detail: `${name} — awaiting approval` },
  });

  // Notify administrators of the pending member.
  const admins = await prisma.user.findMany({
    where: { active: true, role: { in: [ROLES.ADMIN, ROLES.EXECUTIVE] } },
    select: { id: true },
  });
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({ userId: a.id, title: "New member awaiting approval", body: `${name} registered and needs approval.` })),
    });
  }

  // Do NOT log them in — they must be approved first.
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
  if (!user.approved) {
    return { error: "Your account is awaiting administrator approval. Please check back soon." };
  }
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
