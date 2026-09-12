import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { isStaff } from "@/lib/roles";
import { serveUpload } from "@/lib/uploads";

// Serves a member's recorded recitation — gated to that member or staff.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const recitation = await prisma.recitation.findUnique({ where: { id } });
  if (!recitation || !recitation.audioStoredName) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (recitation.memberId !== me.id && !isStaff(me.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    return await serveUpload(req, recitation.audioStoredName, recitation.audioMimeType ?? "audio/mpeg", "private, max-age=0, must-revalidate");
  } catch {
    return NextResponse.json({ error: "file missing" }, { status: 404 });
  }
}
