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
  revalidateQuran();
}

export async function deleteVerse(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  // The admin UI only offers this action when there are no recitations yet
  // (removing a verse members have already submitted for would wipe their
  // leaderboard history) — this is defense-in-depth against a stale page.
  const recitationCount = await prisma.recitation.count({ where: { verseId: id } });
  if (recitationCount > 0) return;

  const verse = await prisma.verse.delete({ where: { id } });
  await prisma.activityLog.create({
    data: { userId: me.id, action: "VERSE_REMOVED", detail: verse.reference },
  });
  revalidateQuran();
}

export async function submitRecitation(_prev: RecitationState, formData: FormData): Promise<RecitationState> {
  const me = await requireMember();
  const verseId = String(formData.get("verseId") ?? "");
  const verse = await prisma.verse.findUnique({ where: { id: verseId } });
  if (!verse || !verse.publishedAt) return { error: "That verse isn't open for submissions." };

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
  revalidateQuran();
  return { ok: true };
}
