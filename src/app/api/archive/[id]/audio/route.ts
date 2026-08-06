import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readUpload } from "@/lib/uploads";

// Public — serves a published archive item's uploaded audio. No auth check:
// this content is meant for anyone. Drafts stay hidden even from a guessed URL.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.archiveItem.findUnique({ where: { id } });
  if (!item || !item.publishedAt || !item.storedName) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const buf = await readUpload(item.storedName);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": item.mimeType ?? "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "file missing" }, { status: 404 });
  }
}
