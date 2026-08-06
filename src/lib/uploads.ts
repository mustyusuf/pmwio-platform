import { writeFile, mkdir, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
export const MAX_UPLOAD_MB = 10;
const MAX_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf",
]);

export const MAX_AUDIO_MB = 15;
const MAX_AUDIO_BYTES = MAX_AUDIO_MB * 1024 * 1024;
// MediaRecorder mime strings often carry a codec suffix, e.g.
// "audio/webm;codecs=opus" — matched by base type below.
const ALLOWED_AUDIO_MIME: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
};

export type SavedFile = { storedName: string; mimeType: string; size: number; originalName: string };
export type SaveResult = { ok: true; file: SavedFile } | { ok: false; error: string };

async function writeToUploads(file: Blob, mime: string, ext: string, originalName: string): Promise<SavedFile> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const storedName = `${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, storedName), bytes);
  return { storedName, mimeType: mime, size: file.size, originalName };
}

/** Validates and writes an uploaded file to the (gitignored) uploads dir. */
export async function saveUpload(file: File | null, opts: { imagesOnly?: boolean } = {}): Promise<SaveResult> {
  if (!file || typeof file === "string" || file.size === 0) return { ok: false, error: "No file provided." };
  if (file.size > MAX_BYTES) return { ok: false, error: `File is too large (max ${MAX_UPLOAD_MB}MB).` };
  const mime = file.type;
  if (!ALLOWED_MIME.has(mime)) return { ok: false, error: "Unsupported file type. Upload a JPG, PNG, GIF, WEBP or PDF." };
  if (opts.imagesOnly && !mime.startsWith("image/")) return { ok: false, error: "Please upload an image file." };

  const ext = mime === "application/pdf" ? "pdf" : mime.split("/")[1];
  return { ok: true, file: await writeToUploads(file, mime, ext, file.name) };
}

/** Validates and writes an uploaded/recorded audio clip to the uploads dir. */
export async function saveAudioUpload(file: File | null): Promise<SaveResult> {
  if (!file || typeof file === "string" || file.size === 0) return { ok: false, error: "No recording provided." };
  if (file.size > MAX_AUDIO_BYTES) return { ok: false, error: `Recording is too large (max ${MAX_AUDIO_MB}MB).` };
  const base = file.type.split(";")[0].trim();
  const ext = ALLOWED_AUDIO_MIME[base];
  if (!ext) return { ok: false, error: "Unsupported audio format. Record or upload a WEBM, MP3, M4A, WAV or OGG file." };

  return { ok: true, file: await writeToUploads(file, base, ext, file.name) };
}

/** Fetches an audio file from a URL and caches it in the uploads dir. */
export async function downloadAudio(url: string): Promise<SaveResult> {
  try {
    const res = await fetch(url);
    if (!res.ok) return { ok: false, error: "Couldn't download the recitation audio." };
    const blob = await res.blob();
    return { ok: true, file: await writeToUploads(blob, "audio/mpeg", "mp3", "recitation.mp3") };
  } catch {
    return { ok: false, error: "Couldn't download the recitation audio." };
  }
}

/** Reads a stored file by name (path-traversal safe). */
export async function readUpload(storedName: string): Promise<Buffer> {
  const safe = path.basename(storedName);
  return readFile(path.join(UPLOAD_DIR, safe));
}

/** Deletes a stored file by name (path-traversal safe). Never throws. */
export async function deleteUpload(storedName: string): Promise<void> {
  const safe = path.basename(storedName);
  try {
    await unlink(path.join(UPLOAD_DIR, safe));
  } catch {
    // Already gone — fine.
  }
}

export function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
