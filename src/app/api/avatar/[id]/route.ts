import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { isStaff } from "@/lib/roles";
import { readUpload } from "@/lib/uploads";

// Serves a user's profile image. Viewable by the user themselves or any staff.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (me.id !== id && !isStaff(me.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const user = await prisma.user.findUnique({ where: { id }, select: { imagePath: true } });
  if (!user?.imagePath) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    const buf = await readUpload(user.imagePath);
    const ext = user.imagePath.split(".").pop() ?? "jpeg";
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": `image/${ext === "jpg" ? "jpeg" : ext}`, "Cache-Control": "private, max-age=0, must-revalidate" },
    });
  } catch {
    return NextResponse.json({ error: "file missing" }, { status: 404 });
  }
}
