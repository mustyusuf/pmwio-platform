import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readUpload } from "@/lib/uploads";

// Public — serves a partner/supporter's logo (shown on the Orphanage page).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const partner = await prisma.partner.findUnique({ where: { id } });
  if (!partner?.storedName) return NextResponse.json({ error: "not found" }, { status: 404 });
  try {
    const buf = await readUpload(partner.storedName);
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": partner.mimeType ?? "image/png", "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "file missing" }, { status: 404 });
  }
}
