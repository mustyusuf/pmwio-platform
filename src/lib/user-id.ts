import { prisma } from "@/lib/db";
import { generateUserId } from "@/lib/auth";

/** Find an unused public User ID, retrying on the rare chance of a collision. */
export async function uniqueUserId(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateUserId();
    const existing = await prisma.user.findUnique({ where: { userId: candidate } });
    if (!existing) return candidate;
  }
  throw new Error("Could not generate a unique User ID. Please try again.");
}
