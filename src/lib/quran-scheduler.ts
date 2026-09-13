import { checkMonthlyLeaderboardEmail } from "@/lib/monthly-email";
import { purgeExpiredRecitationAudio } from "@/lib/recitation-cleanup";
import { notifyMembersOfLiveVerse } from "@/lib/verse-notify";

// Guards against double-starting the intervals on dev hot-reload, where
// register() can run again on the same process.
const globalForScheduler = globalThis as unknown as { quranSchedulerStarted?: boolean };

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

async function runDailyJobs() {
  await checkMonthlyLeaderboardEmail().catch((err) => {
    console.error("[quran] monthly leaderboard email check failed:", err);
  });
  await purgeExpiredRecitationAudio().catch((err) => {
    console.error("[quran] recitation audio purge failed:", err);
  });
}

// Hourly so a verse scheduled for Monday 00:00 is announced that morning,
// not up to a day later.
async function runHourlyJobs() {
  await notifyMembersOfLiveVerse().catch((err) => {
    console.error("[quran] live verse announcement failed:", err);
  });
}

export function startQuranDailyJobs() {
  if (globalForScheduler.quranSchedulerStarted) return;
  globalForScheduler.quranSchedulerStarted = true;

  runDailyJobs();
  runHourlyJobs();
  setInterval(runDailyJobs, ONE_DAY_MS);
  setInterval(runHourlyJobs, ONE_HOUR_MS);
}
