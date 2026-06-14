import { prisma } from "@/lib/db";

/** Reads org settings, creating the singleton row with defaults if missing. */
export async function getSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  return prisma.settings.create({ data: { id: "singleton" } });
}

/** Counts active users eligible to vote at a given role/level. */
export function eligibleCount(role: string) {
  return prisma.user.count({ where: { role, active: true } });
}

/** A quorum can never exceed the number of eligible voters, nor be below 1. */
export function clampQuorum(quorum: number, eligible: number) {
  return Math.max(1, Math.min(quorum, Math.max(eligible, 1)));
}

/** Counts approve/reject decisions in a set of votes. */
export function tally(
  votes: { recommendation?: string; decision?: string }[],
) {
  let approve = 0;
  let reject = 0;
  for (const v of votes) {
    const d = v.recommendation ?? v.decision ?? "";
    if (d.includes("APPROVE")) approve++;
    else if (d.includes("REJECT")) reject++;
  }
  return { approve, reject };
}
