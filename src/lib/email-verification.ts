import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { send, link } from "@/lib/email";
import { verifyEmail } from "@/lib/email-templates";

/**
 * Issues a fresh single-use email-verification token for a user and emails them
 * the confirmation link (#3). Any earlier unused tokens are invalidated so only
 * the latest link works. Best-effort: never throws.
 */
export async function issueEmailVerification(user: { id: string; name: string; email: string }) {
  await prisma.emailVerification.updateMany({ where: { userId: user.id, used: false }, data: { used: true } });
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await prisma.emailVerification.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) }, // 24h
  });
  await send(user.email, verifyEmail(user.name, link(`/verify-email?token=${token}`)));
}
