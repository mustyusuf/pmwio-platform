import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { isStaff, ROLES } from "@/lib/roles";
import { readUpload } from "@/lib/uploads";

// Serves an uploaded application document, gated by who may view the application.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const doc = await prisma.document.findUnique({
    where: { id },
    include: { application: { select: { referredById: true, beneficiaryId: true } } },
  });
  if (!doc || !doc.storedName || !doc.application) return NextResponse.json({ error: "not found" }, { status: 404 });

  const app = doc.application;
  const canView =
    isStaff(me.role) ||
    ((me.role === ROLES.MEMBER || me.role === ROLES.COORDINATOR) && (app.referredById === me.id || app.beneficiaryId === me.id)) ||
    (me.role === ROLES.BENEFICIARY && app.beneficiaryId === me.id);
  if (!canView) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  try {
    const buf = await readUpload(doc.storedName);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": doc.mimeType ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.name)}"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json({ error: "file missing" }, { status: 404 });
  }
}
