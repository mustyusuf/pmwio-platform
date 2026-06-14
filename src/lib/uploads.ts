import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
export const MAX_UPLOAD_MB = 10;
const MAX_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf",
]);

export type SavedFile = { storedName: string; mimeType: string; size: number; originalName: string };
export type SaveResult = { ok: true; file: SavedFile } | { ok: false; error: string };

/** Validates and writes an uploaded file to the (gitignored) uploads dir. */
export async function saveUpload(file: File | null, opts: { imagesOnly?: boolean } = {}): Promise<SaveResult> {
  if (!file || typeof file === "string" || file.size === 0) return { ok: false, error: "No file provided." };
  if (file.size > MAX_BYTES) return { ok: false, error: `File is too large (max ${MAX_UPLOAD_MB}MB).` };
  const mime = file.type;
  if (!ALLOWED_MIME.has(mime)) return { ok: false, error: "Unsupported file type. Upload a JPG, PNG, GIF, WEBP or PDF." };
  if (opts.imagesOnly && !mime.startsWith("image/")) return { ok: false, error: "Please upload an image file." };

  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = mime === "application/pdf" ? "pdf" : mime.split("/")[1];
  const storedName = `${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, storedName), bytes);
  return { ok: true, file: { storedName, mimeType: mime, size: file.size, originalName: file.name } };
}

/** Reads a stored file by name (path-traversal safe). */
export async function readUpload(storedName: string): Promise<Buffer> {
  const safe = path.basename(storedName);
  return readFile(path.join(UPLOAD_DIR, safe));
}

export function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
