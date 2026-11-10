import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readUpload } from "@/lib/uploads";
import { canPreviewHidden } from "@/lib/session";

// Public — serves a team member's portrait (shown on the About page).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await prisma.teamMember.findUnique({ where: { id } });
  if (!member?.storedName) return NextResponse.json({ error: "not found" }, { status: 404 });
  const hidden = !member.active;
  if (hidden && !(await canPreviewHidden())) return NextResponse.json({ error: "not found" }, { status: 404 });
  try {
    const buf = await readUpload(member.storedName);
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": member.mimeType ?? "image/jpeg", "Cache-Control": hidden ? "private, no-store" : "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "file missing" }, { status: 404 });
  }
}
