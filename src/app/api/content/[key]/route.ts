import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readUpload } from "@/lib/uploads";

// Public — serves an admin-uploaded site-content image (e.g. hero background).
export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const row = await prisma.siteContent.findUnique({ where: { key: decodeURIComponent(key) } });
  if (!row || row.type !== "image" || !row.value) return NextResponse.json({ error: "not found" }, { status: 404 });
  try {
    const buf = await readUpload(row.value);
    const ext = row.value.split(".").pop() ?? "jpeg";
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": `image/${ext === "jpg" ? "jpeg" : ext}`, "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "file missing" }, { status: 404 });
  }
}
