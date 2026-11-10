import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readUpload } from "@/lib/uploads";
import { canPreviewHidden } from "@/lib/session";
import { isLegacyImageSource } from "@/lib/legacyImages";

// Public — serves a gallery image (gallery is shown on the public site).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const img = await prisma.galleryImage.findUnique({ where: { id }, include: { album: { select: { draft: true } } } });
  if (!img) return NextResponse.json({ error: "not found" }, { status: 404 });
  // Hidden images and drafts are only for the admins managing them.
  const hidden = !img.active || Boolean(img.album?.draft);
  if (hidden && !(await canPreviewHidden())) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (isLegacyImageSource(img.storedName)) {
    return NextResponse.redirect(new URL(img.storedName, req.url));
  }
  try {
    const buf = await readUpload(img.storedName);
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": img.mimeType ?? "image/jpeg", "Cache-Control": hidden ? "private, no-store" : "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "file missing" }, { status: 404 });
  }
}
