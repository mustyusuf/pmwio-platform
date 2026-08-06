"use client";

import { useState } from "react";
import { useActionState } from "react";
import { BookPlus, RotateCcw, Search } from "lucide-react";
import { createVerse, previewVerse, type VerseState, type VersePreview } from "@/app/actions/quran";
import { SURAHS, getSurah } from "@/lib/quran-source";

const label = "block text-sm font-medium text-brand-900";
const input =
  "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

function Feedback({ state }: { state: VerseState }) {
  if (state?.error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p>;
  if (state?.ok) return <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">Verse added.</p>;
  return null;
}

export function VerseCreateForm() {
  const [surahNumber, setSurahNumber] = useState(SURAHS[0].number);
  const [ayahNumber, setAyahNumber] = useState(1);
  const [preview, setPreview] = useState<VersePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [state, action, isPending] = useActionState<VerseState, FormData>(createVerse, null);

  const surah = getSurah(surahNumber) ?? SURAHS[0];

  async function handlePreview() {
    setLoading(true);
    setPreview(await previewVerse(surahNumber, ayahNumber));
    setLoading(false);
  }

  // Step 1: pick a surah + ayah (also shown again if the last preview failed).
  if (!preview || !preview.ok) {
    return (
      <div className="space-y-4">
        <Feedback state={state} />
        {preview && !preview.ok && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{preview.error}</p>
        )}
        <div>
          <label className={label} htmlFor="surahNumber">Surah</label>
          <select
            id="surahNumber"
            className={input}
            value={surahNumber}
            onChange={(e) => {
              setSurahNumber(Number(e.target.value));
              setAyahNumber(1);
            }}
          >
            {SURAHS.map((s) => (
              <option key={s.number} value={s.number}>
                {s.number}. {s.englishName} — {s.englishNameTranslation}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="ayahNumber">Ayah</label>
          <input
            id="ayahNumber"
            type="number"
            min={1}
            max={surah.numberOfAyahs}
            value={ayahNumber}
            onChange={(e) => setAyahNumber(Number(e.target.value))}
            className={input}
          />
          <p className="mt-1 text-xs text-brand-900/50">{surah.englishName} has {surah.numberOfAyahs} ayahs.</p>
        </div>
        <button
          type="button"
          onClick={handlePreview}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
        >
          <Search className="h-4 w-4" aria-hidden />
          {loading ? "Fetching…" : "Preview verse"}
        </button>
      </div>
    );
  }

  // Step 2: review the fetched text + audio, tweak wording, then publish.
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="surahNumber" value={surahNumber} />
      <input type="hidden" name="ayahNumber" value={ayahNumber} />
      <Feedback state={state} />
      <div>
        <p className={label}>{preview.reference}</p>
        <p dir="rtl" lang="ar" className="mt-1.5 rounded-lg border border-brand-200 bg-brand-50/40 px-3 py-3 text-right text-xl leading-relaxed text-brand-950">
          {preview.arabicText}
        </p>
      </div>
      <audio controls src={preview.audioUrl} className="w-full" />
      <div>
        <label className={label} htmlFor="transliteration">Transliteration</label>
        <textarea id="transliteration" name="transliteration" defaultValue={preview.transliteration} required rows={3} className={input} />
      </div>
      <div>
        <label className={label} htmlFor="translation">Translation</label>
        <textarea id="translation" name="translation" defaultValue={preview.translation} required rows={3} className={input} />
      </div>
      <div>
        <label className={label} htmlFor="weekOf">Challenge week (starting)</label>
        <input id="weekOf" name="weekOf" type="date" required className={input} />
      </div>
      <label className="flex items-center gap-2 text-sm text-brand-900">
        <input type="checkbox" name="publish" value="true" defaultChecked className="rounded border-brand-300" />
        Publish immediately (members can see and submit for it right away)
      </label>
      <div className="flex gap-2">
        <button
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
        >
          <BookPlus className="h-4 w-4" aria-hidden />
          {isPending ? "Adding…" : "Add verse"}
        </button>
        <button
          type="button"
          onClick={() => setPreview(null)}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Choose a different verse
        </button>
      </div>
    </form>
  );
}
