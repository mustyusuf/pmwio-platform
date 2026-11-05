import { checkMonthlyLeaderboardEmail } from "@/lib/monthly-email";
import { purgeExpiredRecitationAudio } from "@/lib/recitation-cleanup";
import { notifyMembersOfLiveVerse } from "@/lib/verse-notify";
import { checkAndSendReminders } from "@/lib/verse-email";
import { lagosHour } from "@/lib/timezone";
import { reconcilePendingDonations } from "@/lib/paystack";
import { retryRecentFailures } from "@/lib/email-tracking";

// Guards against double-starting the interval on dev hot-reload, where
// register() can run again on the same process.
const globalForScheduler = globalThis as unknown as { quranSchedulerStarted?: boolean };

// Polled (rather than a single 24h setTimeout) so the 6am send still happens
// on schedule even if the process was restarted a few hours earlier — the
// individual checks below guard their own idempotency, so ticking every 10
// minutes just narrows how late a 6am job can start.
const CHECK_INTERVAL_MS = 10 * 60 * 1000;
// Mornings (West Africa Time): the Qur'an emails go out from 6:00am, and any
// that were missed — the app was restarting or redeploying, or the mail server
// was briefly down — are picked up on a later tick that morning rather than
// waiting a whole day. Each job guards its own idempotency, so extra ticks in
// the window never double-send.
const SEND_FROM_HOUR_LAGOS = 6;
const SEND_UNTIL_HOUR_LAGOS = 12; // exclusive
const RECONCILE_HOUR_LAGOS = 6;

async function runDailyJobs() {
  // Only the time-sensitive, member-facing Qur'an Challenge emails wait for
  // the morning window; the audio purge has no reason to and runs every tick.
  const hour = lagosHour();
  if (hour >= SEND_FROM_HOUR_LAGOS && hour < SEND_UNTIL_HOUR_LAGOS) {
    await notifyMembersOfLiveVerse().catch((err) => {
      console.error("[quran] live verse announcement failed:", err);
    });
    await checkAndSendReminders().catch((err) => {
      console.error("[quran] weekly verse reminder check failed:", err);
    });
    await checkMonthlyLeaderboardEmail().catch((err) => {
      console.error("[quran] monthly leaderboard email check failed:", err);
    });
    await retryRecentFailures().catch((err) => {
      console.error("[quran] retrying failed emails failed:", err);
    });
  }
  // Not Qur'an-specific, but this is the app's only daily job runner: settle
  // donations stuck as PENDING (abandoned checkouts, missed webhooks). Once a
  // day is plenty, so it keeps to the first hour of the window.
  if (hour === RECONCILE_HOUR_LAGOS) {
    await reconcilePendingDonations().catch((err) => {
      console.error("[paystack] pending donation reconcile failed:", err);
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
