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

// Polled every few minutes (rather than one timed send) so nothing depends on
// being up at a particular moment: after a restart, a redeploy or an outage the
// next tick catches up and sends whatever is due — the current week's verse
// announcement, any reminder owed, last month's recap, and retries for emails
// that failed. Every job guards its own idempotency (notifiedAt,
// reminderCount/lastReminderSentAt, the recap month, per-recipient delivery
// status), so frequent ticks never double-send.
const CHECK_INTERVAL_MS = 10 * 60 * 1000;
// Reminders are the one thing that shouldn't land in the middle of the night:
// one that falls due overnight simply goes out from 6am.
const REMINDERS_FROM_HOUR_LAGOS = 6;
const RECONCILE_HOUR_LAGOS = 6;

export async function runDailyJobs() {
  const hour = lagosHour();
  await notifyMembersOfLiveVerse().catch((err) => {
    console.error("[quran] live verse announcement failed:", err);
  });
  if (hour >= REMINDERS_FROM_HOUR_LAGOS) {
    await checkAndSendReminders().catch((err) => {
      console.error("[quran] weekly verse reminder check failed:", err);
    });
  }
  await checkMonthlyLeaderboardEmail().catch((err) => {
    console.error("[quran] monthly leaderboard email check failed:", err);
  });
  await retryRecentFailures().catch((err) => {
    console.error("[quran] retrying failed emails failed:", err);
  });
  // Not Qur'an-specific, but this is the app's only daily job runner: settle
  // donations stuck as PENDING (abandoned checkouts, missed webhooks). Once a
  // day is plenty, so it keeps to the 6am hour.
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
