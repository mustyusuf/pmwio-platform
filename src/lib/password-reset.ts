import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { link } from "@/lib/email";

/** Creates a single-use, 30-minute password reset token for a user and returns the link to send them. */
export async function createPasswordResetLink(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await prisma.passwordReset.create({
    data: { userId, tokenHash, expiresAt: new Date(Date.now() + 1000 * 60 * 30) },
  });
  return link(`/reset-password?token=${token}`);
}
