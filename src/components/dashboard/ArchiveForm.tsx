"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Archive } from "lucide-react";
import { createArchiveItem, type ArchiveState } from "@/app/actions/archive";
import { CATEGORY_LABEL, MEDIA_TYPE_LABEL } from "@/lib/archive-constants";

const label = "block text-sm font-medium text-brand-900";
const input =
  "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

function Feedback({ state }: { state: ArchiveState }) {
  if (state?.error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p>;
  if (state?.ok) return <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">Archive item added.</p>;
  return null;
}

export function ArchiveCreateForm() {
  const [mediaType, setMediaType] = useState<"VIDEO_LINK" | "AUDIO_LINK" | "AUDIO_FILE">("VIDEO_LINK");
  const [state, action, isPending] = useActionState<ArchiveState, FormData>(createArchiveItem, null);

  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      <div>
        <label className={label} htmlFor="title">Title</label>
        <input id="title" name="title" required className={input} placeholder="e.g. Ramadan lecture series — Night 1" />
      </div>
      <div>
        <label className={label} htmlFor="description">Description (optional)</label>
        <textarea id="description" name="description" rows={2} maxLength={1000} className={input} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="category">Category</label>
          <select id="category" name="category" className={input} defaultValue="LECTURE">
            {Object.entries(CATEGORY_LABEL).map(([value, text]) => (
              <option key={value} value={value}>{text}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="eventDate">Event date (optional)</label>
          <input id="eventDate" name="eventDate" type="date" className={input} />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="mediaType">Media type</label>
        <select
          id="mediaType"
          name="mediaType"
          className={input}
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value as typeof mediaType)}
        >
          {Object.entries(MEDIA_TYPE_LABEL).map(([value, text]) => (
            <option key={value} value={value}>{text}</option>
          ))}
        </select>
      </div>

      {mediaType === "AUDIO_FILE" ? (
        <div>
          <label className={label} htmlFor="audio">Audio file</label>
          <input
            id="audio"
            name="audio"
            type="file"
            accept="audio/*"
            required
            className={`${input} file:mr-3 file:rounded-md file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-800`}
          />
          <p className="mt-1 text-xs text-brand-900/50">WEBM, MP3, M4A, WAV or OGG — up to 15MB.</p>
        </div>
      ) : (
        <div>
          <label className={label} htmlFor="url">
            {mediaType === "VIDEO_LINK" ? "Video link (YouTube, Vimeo or Facebook)" : "Audio link (e.g. SoundCloud)"}
          </label>
          <input id="url" name="url" type="url" required className={input} placeholder="https://…" />
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-brand-900">
        <input type="checkbox" name="publish" value="true" defaultChecked className="rounded border-brand-300" />
        Publish immediately (visible on the public Archive page right away)
      </label>
      <button
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
      >
        <Archive className="h-4 w-4" aria-hidden />
        {isPending ? "Adding…" : "Add to archive"}
      </button>
    </form>
  );
}
