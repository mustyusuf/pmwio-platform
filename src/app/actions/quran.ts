"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { saveAudioUpload, downloadAudio } from "@/lib/uploads";
import { getSurah, audioUrl, verseReference, fetchVerseText } from "@/lib/quran-source";
import { getMemberStanding } from "@/lib/leaderboard";
import { emailVerseToMembers, notifyMembersOfLiveVerse } from "@/lib/verse-notify";
import { emailReminderToPending } from "@/lib/verse-email";
import { isEmailConfigured, send } from "@/lib/email";
import { recitationReceived } from "@/lib/email-templates";

export type VerseState = { ok?: boolean; error?: string } | null;
export type RecitationState = { ok?: boolean; error?: string } | null;

export type VersePreview =
  | { ok: true; reference: string; arabicText: string; transliteration: string; translation: string; audioUrl: string }
  | { ok: false; error: string };

async function requireAdmin() {
  const me = await getCurrentUser();
  if (!me || !(me.role === ROLES.ADMIN || me.role === ROLES.EXECUTIVE)) redirect("/dashboard");
  return me;
}

async function requireMember() {
  const me = await getCurrentUser();
  if (!me || me.role !== ROLES.MEMBER) redirect("/dashboard");
  return me;
}

/** The admin verse list and the member-facing challenge/leaderboard pages. */
function revalidateQuran() {
  revalidatePath("/dashboard/quran-admin");
  revalidatePath("/dashboard/quran");
  revalidatePath("/dashboard/quran/leaderboard");
}

/** Validates a surah/ayah pair against the static surah list. */
function validAyah(surahNumber: number, ayahNumber: number): string | null {
  const surah = getSurah(surahNumber);
  if (!surah) return "Pick a valid surah.";
  if (!Number.isInteger(ayahNumber) || ayahNumber < 1 || ayahNumber > surah.numberOfAyahs) {
    return `${surah.englishName} has ${surah.numberOfAyahs} ayahs — pick a number in that range.`;
  }
  return null;
}

/** Fetches Arabic text, transliteration, translation and a listenable audio URL for one ayah. */
export async function previewVerse(surahNumber: number, ayahNumber: number): Promise<VersePreview> {
  await requireAdmin();
  const invalid = validAyah(surahNumber, ayahNumber);
  if (invalid) return { ok: false, error: invalid };

  const text = await fetchVerseText(surahNumber, ayahNumber);
  if (!text) return { ok: false, error: "Couldn't fetch that verse — try again in a moment." };

  return {
    ok: true,
    reference: verseReference(surahNumber, ayahNumber),
    arabicText: text.arabicText,
    transliteration: text.transliteration,
    translation: text.translation,
    audioUrl: audioUrl(surahNumber, ayahNumber),
  };
}

const verseSchema = z.object({
  surahNumber: z.coerce.number().int(),
  ayahNumber: z.coerce.number().int(),
  transliteration: z.string().trim().min(2, "Enter the transliteration."),
  translation: z.string().trim().min(2, "Enter the translation."),
  weekOf: z.string().trim().refine((v) => !Number.isNaN(Date.parse(v)), "Pick a valid week date."),
});

export async function createVerse(_prev: VerseState, formData: FormData): Promise<VerseState> {
  const me = await requireAdmin();
  const parsed = verseSchema.safeParse({
    surahNumber: formData.get("surahNumber"),
    ayahNumber: formData.get("ayahNumber"),
    transliteration: formData.get("transliteration"),
    translation: formData.get("translation"),
    weekOf: formData.get("weekOf"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const invalid = validAyah(parsed.data.surahNumber, parsed.data.ayahNumber);
  if (invalid) return { error: invalid };

  const text = await fetchVerseText(parsed.data.surahNumber, parsed.data.ayahNumber);
  if (!text) return { error: "Couldn't fetch that verse — try again in a moment." };

  const audio = await downloadAudio(audioUrl(parsed.data.surahNumber, parsed.data.ayahNumber));
  if (!audio.ok) return { error: audio.error };

  const reference = verseReference(parsed.data.surahNumber, parsed.data.ayahNumber);
  try {
    await prisma.verse.create({
      data: {
        surahNumber: parsed.data.surahNumber,
        ayahNumber: parsed.data.ayahNumber,
        reference,
        arabicText: text.arabicText,
        transliteration: parsed.data.transliteration,
        translation: parsed.data.translation,
        weekOf: new Date(parsed.data.weekOf),
        audioStoredName: audio.file.storedName,
        audioMimeType: audio.file.mimeType,
        createdById: me.id,
        publishedAt: formData.get("publish") === "true" ? new Date() : null,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "A verse is already scheduled for that week." };
    }
    throw e;
  }
  await prisma.activityLog.create({
    data: { userId: me.id, action: "VERSE_ADDED", detail: reference },
  });
  // Announces immediately if this verse is live now; scheduled verses are
  // picked up by the 6am Africa/Lagos scheduler tick when their week begins
  // (see src/lib/quran-scheduler.ts).
  await notifyMembersOfLiveVerse();
  revalidateQuran();
  return { ok: true };
}

export async function togglePublishVerse(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  const publish = String(formData.get("publish")) === "true";
  const verse = await prisma.verse.update({
    where: { id },
    data: { publishedAt: publish ? new Date() : null },
  });
  await prisma.activityLog.create({
    data: { userId: me.id, action: publish ? "VERSE_PUBLISHED" : "VERSE_UNPUBLISHED", detail: verse.reference },
  });
  if (publish) await notifyMembersOfLiveVerse();
  revalidateQuran();
}

export type EmailVerseState = { ok?: boolean; warning?: boolean; error?: string; message?: string } | null;

/**
 * Manually emails the current week's verse to every active member. For when
 * the automatic announcement was missed or failed (late upload, SMTP trouble).
 * Safe to press again: a verse that was never announced goes through the normal
 * announcement (in-app notification + email); an already-announced one is
 * re-emailed only. Every send lands in the delivery log.
 */
export async function emailVerseToAllMembers(_prev: EmailVerseState, formData: FormData): Promise<EmailVerseState> {
  const me = await requireAdmin();
  const verse = await prisma.verse.findUnique({ where: { id: String(formData.get("id")) } });
  if (!verse) return { error: "That verse no longer exists." };
  if (!verse.publishedAt) return { error: "Publish the verse first — members can't see it yet." };
  const live = await prisma.verse.findFirst({
    where: { publishedAt: { not: null }, weekOf: { lte: new Date() } },
    orderBy: { weekOf: "desc" },
    select: { id: true },
  });
  if (live?.id !== verse.id) return { error: "Only the current week's verse can be emailed to members." };
  if (!isEmailConfigured()) return { error: "Email isn't set up on this server (SMTP settings are missing), so nothing can be sent." };

  let campaignId: string | undefined;
  if (!verse.notifiedAt) {
    await notifyMembersOfLiveVerse();
    campaignId = (await prisma.emailCampaign.findFirst({ where: { kind: "VERSE_LIVE", refId: verse.id }, orderBy: { createdAt: "desc" }, select: { id: true } }))?.id;
  }
  const summary = campaignId
    ? await prisma.emailCampaign.findUnique({ where: { id: campaignId }, select: { id: true, total: true, sent: true, failed: true } })
    : await emailVerseToMembers(verse, me.id);
  if (!summary) return { error: "There are no active members to email." };

  await prisma.activityLog.create({
    data: { userId: me.id, action: "VERSE_EMAILED", detail: `${verse.reference} — ${summary.sent} of ${summary.total} delivered` },
  });
  revalidateQuran();
  revalidatePath("/dashboard/email-log");
  return {
    ok: summary.failed === 0,
    warning: summary.failed > 0,
    message: summary.failed === 0
      ? `Emailed ${summary.sent} member${summary.sent === 1 ? "" : "s"}.`
      : `Emailed ${summary.sent} of ${summary.total} members — ${summary.failed} failed. See the delivery log to retry.`,
  };
}

/**
 * Manually sends the "submit your recitation" reminder to every active member
 * who hasn't recited the current week's verse yet. Doesn't use up one of the
 * three scheduled reminders. Every send lands in the delivery log.
 */
export async function emailReminderToPendingMembers(_prev: EmailVerseState, formData: FormData): Promise<EmailVerseState> {
  const me = await requireAdmin();
  const verse = await prisma.verse.findUnique({ where: { id: String(formData.get("id")) } });
  if (!verse) return { error: "That verse no longer exists." };
  const live = await prisma.verse.findFirst({
    where: { publishedAt: { not: null }, weekOf: { lte: new Date() } },
    orderBy: { weekOf: "desc" },
    select: { id: true },
  });
  if (!verse.publishedAt || live?.id !== verse.id) return { error: "Reminders can only be sent for the current week's verse." };
  if (!isEmailConfigured()) return { error: "Email isn't set up on this server (SMTP settings are missing), so nothing can be sent." };

  const summary = await emailReminderToPending(verse, me.id);
  if (!summary) return { error: "Every active member has already submitted — nobody needs a reminder." };

  await prisma.activityLog.create({
    data: { userId: me.id, action: "VERSE_REMINDER_SENT", detail: `${verse.reference} — ${summary.sent} of ${summary.total} delivered` },
  });
  revalidateQuran();
  revalidatePath("/dashboard/email-log");
  return {
    ok: summary.failed === 0,
    warning: summary.failed > 0,
    message: summary.failed === 0
      ? `Reminded ${summary.sent} member${summary.sent === 1 ? "" : "s"} who haven't submitted.`
      : `Reminded ${summary.sent} of ${summary.total} members — ${summary.failed} failed. See the delivery log to retry.`,
  };
}

export async function deleteVerse(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  // Deliberately allowed even when members have submitted recitations for
  // this verse — the DB cascade (see schema.prisma) removes those
  // Recitation rows too, which lowers the affected members' leaderboard
  // counts/streaks. The admin UI warns about this before submitting.
  const recitationCount = await prisma.recitation.count({ where: { verseId: id } });
  const verse = await prisma.verse.delete({ where: { id } });
  await prisma.activityLog.create({
    data: {
      userId: me.id,
      action: "VERSE_REMOVED",
      detail: recitationCount > 0 ? `${verse.reference} (${recitationCount} recitation${recitationCount === 1 ? "" : "s"} removed)` : verse.reference,
    },
  });
  revalidateQuran();
}

export async function submitRecitation(_prev: RecitationState, formData: FormData): Promise<RecitationState> {
  const me = await requireMember();
  const verseId = String(formData.get("verseId") ?? "");
  const verse = await prisma.verse.findUnique({ where: { id: verseId } });
  if (!verse || !verse.publishedAt || verse.weekOf > new Date()) return { error: "That verse isn't open for submissions." };

  const file = formData.get("audio");
  if (!(file instanceof File) || file.size === 0) return { error: "Record or upload your recitation first." };
  const res = await saveAudioUpload(file);
  if (!res.ok) return { error: res.error };

  try {
    await prisma.recitation.create({
      data: {
        verseId: verse.id,
        memberId: me.id,
        audioStoredName: res.file.storedName,
        audioMimeType: res.file.mimeType,
        audioSize: res.file.size,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "You've already submitted your recitation for this week." };
    }
    throw e;
  }

  await prisma.activityLog.create({
    data: { userId: me.id, action: "RECITATION_SUBMITTED", detail: verse.reference },
  });

  const standing = await getMemberStanding(me.id);
  await prisma.notification.create({
    data: {
      userId: me.id,
      title: "Recitation received",
      body: `Your recitation of ${verse.reference} has been recorded. Total: ${standing.allTimeCount} · streak: ${standing.streak} week${standing.streak === 1 ? "" : "s"}.`,
    },
  });
  // Email #36 — confirmation to the member.
  await send(me.email, recitationReceived(me.name, verse.reference, standing.allTimeCount, standing.streak));

  // In-app heads-up for admins/executives (no email — one per member per week would be noise).
  const admins = await prisma.user.findMany({
    where: { active: true, role: { in: [ROLES.ADMIN, ROLES.EXECUTIVE] } },
    select: { id: true },
  });
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        title: "New recitation submitted",
        body: `${me.name} submitted a recitation of ${verse.reference}.`,
      })),
    });
  }

  revalidateQuran();
  return { ok: true };
}
