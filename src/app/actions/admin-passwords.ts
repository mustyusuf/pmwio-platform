"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ADMIN_PASSWORD_MANAGEABLE_ROLES, ROLES } from "@/lib/roles";
import { hashPassword } from "@/lib/auth";
import { isEmailConfigured, link, send } from "@/lib/email";
import { passwordChangedByAdmin, passwordReset } from "@/lib/email-templates";
import { createPasswordResetLink } from "@/lib/password-reset";

export type AdminPasswordResult =
  | {
      ok: true;
      message: string;
      resetUrl?: string;
      // Present after setting a password: what the admin needs to pass it on.
      account?: { name: string; userId: string; phone: string | null; loginUrl: string };
    }
  | { ok: false; error: string };

async function requireAdmin() {
  const me = await getCurrentUser();
  if (!me || !(me.role === ROLES.ADMIN || me.role === ROLES.EXECUTIVE)) redirect("/dashboard");
  return me;
}

/** The account must exist and be of a kind admins are allowed to manage. */
async function manageableTarget(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "That account no longer exists." } as const;
  if (!ADMIN_PASSWORD_MANAGEABLE_ROLES.includes(user.role)) {
    return { ok: false, error: "Passwords for this kind of account can't be changed by an administrator. They can use \"Forgot password\" on the login page." } as const;
  }
  return { ok: true, user } as const;
}

const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(100, "That password is too long.");

/**
 * Sets a new password for a member and returns what the administrator needs
 * to pass it on (User ID, phone, login link). The member is always emailed
 * that an administrator changed it; the password itself is only included in
 * that email if the administrator explicitly asks (`emailPassword`), since
 * some members never receive our emails. Any reset links the member had
 * pending are cancelled.
 */
export async function setMemberPassword(
  userId: string,
  password: string,
  opts: { emailPassword?: boolean } = {},
): Promise<AdminPasswordResult> {
  const me = await requireAdmin();
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the password." };

  const target = await manageableTarget(userId);
  if (!target.ok) return { ok: false, error: target.error };
  const { user } = target;

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data) } }),
    prisma.passwordReset.updateMany({ where: { userId: user.id, used: false }, data: { used: true } }),
    prisma.activityLog.create({
      data: {
        userId: me.id,
        action: "PASSWORD_SET_BY_ADMIN",
        detail: `${user.name} (${user.userId})${opts.emailPassword ? " — details emailed" : ""}`,
      },
    }),
  ]);
  await send(user.email, passwordChangedByAdmin(user.name, opts.emailPassword ? { userId: user.userId, password: parsed.data } : undefined));

  return {
    ok: true,
    message: `Password updated for ${user.name}.`,
    account: { name: user.name, userId: user.userId, phone: user.phone, loginUrl: link("/login") },
  };
}

/** Emails a member a single-use link (valid 30 minutes) to choose their own new password. */
export async function sendMemberResetLink(userId: string): Promise<AdminPasswordResult> {
  const me = await requireAdmin();
  const target = await manageableTarget(userId);
  if (!target.ok) return { ok: false, error: target.error };
  const { user } = target;

  const resetUrl = await createPasswordResetLink(user.id);
  await send(user.email, passwordReset(user.name, resetUrl, true));
  await prisma.activityLog.create({
    data: { userId: me.id, action: "PASSWORD_RESET_SENT_BY_ADMIN", detail: `${user.name} (${user.userId})` },
  });

  // If the server can't send email, hand the link to the administrator so
  // they can pass it on themselves.
  return isEmailConfigured()
    ? { ok: true, message: `A reset link was emailed to ${user.email}. It expires in 30 minutes.` }
    : { ok: true, message: "Email isn't set up on this server, so nothing was emailed. Share this link with the member (it expires in 30 minutes):", resetUrl };
}
