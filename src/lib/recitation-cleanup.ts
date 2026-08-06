import { prisma } from "@/lib/db";
import { deleteUpload } from "@/lib/uploads";

/** Recitation audio is kept for this long, then purged — the row (and its
 * contribution to the leaderboard/streak) stays forever; only the file goes. */
export const AUDIO_RETENTION_WEEKS = 8;

/** Deletes audio files for recitations past the retention window, keeping
 * the Recitation rows intact. Safe to call repeatedly. Returns the count purged. */
export async function purgeExpiredRecitationAudio(): Promise<number> {
  const cutoff = new Date(Date.now() - AUDIO_RETENTION_WEEKS * 7 * 24 * 60 * 60 * 1000);
  const expired = await prisma.recitation.findMany({
    where: { submittedAt: { lt: cutoff }, audioStoredName: { not: null } },
    select: { id: true, audioStoredName: true },
  });

  for (const r of expired) {
    if (r.audioStoredName) await deleteUpload(r.audioStoredName);
    await prisma.recitation.update({
      where: { id: r.id },
      data: { audioStoredName: null, audioMimeType: null },
    });
  }
  return expired.length;
}
