import { checkMonthlyLeaderboardEmail } from "@/lib/monthly-email";
import { purgeExpiredRecitationAudio } from "@/lib/recitation-cleanup";
import { notifyMembersOfLiveVerse } from "@/lib/verse-notify";
import { checkAndSendReminders } from "@/lib/verse-email";
import { lagosHour } from "@/lib/timezone";

// Guards against double-starting the interval on dev hot-reload, where
// register() can run again on the same process.
const globalForScheduler = globalThis as unknown as { quranSchedulerStarted?: boolean };

// Polled (rather than a single 24h setTimeout) so the 6am send still happens
// on schedule even if the process was restarted a few hours earlier — the
// individual checks below guard their own idempotency, so ticking every 10
// minutes just narrows how late a 6am job can start.
const CHECK_INTERVAL_MS = 10 * 60 * 1000;
const SEND_HOUR_LAGOS = 6; // 6:00am West Africa Time — when members start their day

async function runDailyJobs() {
  // Only the time-sensitive, member-facing Qur'an Challenge emails wait for
  // the 6am window; the audio purge has no reason to and runs every tick.
  if (lagosHour() === SEND_HOUR_LAGOS) {
    await notifyMembersOfLiveVerse().catch((err) => {
      console.error("[quran] live verse announcement failed:", err);
    });
    await checkAndSendReminders().catch((err) => {
      console.error("[quran] weekly verse reminder check failed:", err);
    });
    await checkMonthlyLeaderboardEmail().catch((err) => {
      console.error("[quran] monthly leaderboard email check failed:", err);
    });
  }
  await purgeExpiredRecitationAudio().catch((err) => {
    console.error("[quran] recitation audio purge failed:", err);
  });
}

export function startQuranDailyJobs() {
  if (globalForScheduler.quranSchedulerStarted) return;
  globalForScheduler.quranSchedulerStarted = true;

  runDailyJobs();
  setInterval(runDailyJobs, CHECK_INTERVAL_MS);
}
