"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Mic, Square, Upload, RotateCcw, X } from "lucide-react";
import { submitRecitation, type RecitationState } from "@/app/actions/quran";
import { formatDate } from "@/components/dashboard/ui";

const COUNTDOWN_FROM = 3;
const PREFERRED_MIME = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return PREFERRED_MIME.find((m) => MediaRecorder.isTypeSupported(m));
}

/** Puts a Blob into a hidden file input so it's collected as normal form data. */
function loadIntoInput(input: HTMLInputElement, blob: Blob, filename: string) {
  const dt = new DataTransfer();
  dt.items.add(new File([blob], filename, { type: blob.type }));
  input.files = dt.files;
}

function Feedback({ state }: { state: RecitationState }) {
  if (state?.error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p>;
  return null;
}

export function RecitationRecorder({
  verseId,
  existing,
}: {
  verseId: string;
  existing?: { id: string; submittedAt: string; hasAudio: boolean } | null;
}) {
  const [state, action, isPending] = useActionState<RecitationState, FormData>(submitRecitation, null);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
    };
  }, []);

  if (existing) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
        <p className="text-sm font-semibold text-emerald-800">
          Submitted {formatDate(existing.submittedAt)} — thank you!
        </p>
        {existing.hasAudio ? (
          <audio controls src={`/api/recitations/${existing.id}/audio`} className="mt-3 w-full" />
        ) : (
          <p className="mt-2 text-xs text-emerald-800/70">
            The recording has been cleared to save space, but it still counts toward your streak and leaderboard total.
          </p>
        )}
      </div>
    );
  }

  async function startRecording() {
    setMicError(null);
    // getUserMedia only exists in a "secure context" (https://, or the exact
    // host "localhost") — browsers hide it entirely everywhere else, e.g. a
    // phone opening the site via the host machine's plain-http LAN address.
    // That's a browser/OS rule no site setting can override, so route those
    // members to the file-upload option instead of a confusing generic error.
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError(
        "Recording needs a secure (https://) address, which this one isn't. Upload an audio file instead, or open the site's normal https:// link to record directly.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = pickRecorderMime();
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (fileInputRef.current) loadIntoInput(fileInputRef.current, blob, "recitation.webm");
        setPreviewUrl(URL.createObjectURL(blob));
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      mediaRecorderRef.current = recorder;

      // Give the member a moment to get ready before capture actually starts.
      let n = COUNTDOWN_FROM;
      setCountdown(n);
      const tick = () => {
        n -= 1;
        if (n <= 0) {
          setCountdown(null);
          recorder.start();
          setRecording(true);
        } else {
          setCountdown(n);
          countdownTimeoutRef.current = setTimeout(tick, 1000);
        }
      };
      countdownTimeoutRef.current = setTimeout(tick, 1000);
    } catch {
      setMicError("Couldn't access your microphone. Check the browser's permission for this site, or upload a file instead.");
    }
  }

  function cancelCountdown() {
    if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
    countdownTimeoutRef.current = null;
    setCountdown(null);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreviewUrl(URL.createObjectURL(file));
  }

  function reset() {
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="verseId" value={verseId} />
      <input ref={fileInputRef} type="file" name="audio" accept="audio/*" onChange={onFilePicked} className="hidden" />

      <Feedback state={state} />
      {micError && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">{micError}</p>}

      {!previewUrl && !recording && countdown === null && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={startRecording}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
          >
            <Mic className="h-4 w-4" aria-hidden />
            Record your recitation
          </button>
          <span className="text-xs text-brand-900/50">or</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            <Upload className="h-4 w-4" aria-hidden />
            Upload an audio file
          </button>
        </div>
      )}

      {countdown !== null && (
        <div className="flex flex-col items-center gap-2 rounded-lg bg-brand-50 py-8">
          <span key={countdown} className="animate-[pulse_1s_ease-in-out] text-5xl font-bold text-brand-700">
            {countdown}
          </span>
          <p className="text-sm text-brand-900/60">Get ready to recite…</p>
          <button
            type="button"
            onClick={cancelCountdown}
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-900/50 hover:text-brand-900/80"
          >
            <X className="h-3 w-3" aria-hidden />
            Cancel
          </button>
        </div>
      )}

      {recording && (
        <button
          type="button"
          onClick={stopRecording}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
        >
          <Square className="h-4 w-4" aria-hidden />
          Stop recording
        </button>
      )}

      {previewUrl && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-brand-900">Preview your recitation before submitting:</p>
          <audio controls src={previewUrl} className="w-full" />
          <div className="flex gap-2">
            <button
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
            >
              {isPending ? "Submitting…" : "Submit recitation"}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Start over
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
