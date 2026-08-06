import { checkMonthlyLeaderboardEmail } from "@/lib/monthly-email";
import { purgeExpiredRecitationAudio } from "@/lib/recitation-cleanup";

// Guards against double-starting the interval on dev hot-reload, where
// register() can run again on the same process.
const globalForScheduler = globalThis as unknown as { quranSchedulerStarted?: boolean };

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function runDailyJobs() {
  await checkMonthlyLeaderboardEmail().catch((err) => {
    console.error("[quran] monthly leaderboard email check failed:", err);
  });
  await purgeExpiredRecitationAudio().catch((err) => {
    console.error("[quran] recitation audio purge failed:", err);
  });
}

export function startQuranDailyJobs() {
  if (globalForScheduler.quranSchedulerStarted) return;
  globalForScheduler.quranSchedulerStarted = true;

  runDailyJobs();
  setInterval(runDailyJobs, ONE_DAY_MS);
}
