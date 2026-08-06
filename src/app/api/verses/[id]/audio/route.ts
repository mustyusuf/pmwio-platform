import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { isStaff } from "@/lib/roles";
import { readUpload } from "@/lib/uploads";

// Serves a verse's reference recitation to any signed-in user (published
// verses) or to staff previewing a draft before publishing it.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const verse = await prisma.verse.findUnique({ where: { id } });
  if (!verse || (!verse.publishedAt && !isStaff(me.role))) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    const buf = await readUpload(verse.audioStoredName);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": verse.audioMimeType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "file missing" }, { status: 404 });
  }
}
