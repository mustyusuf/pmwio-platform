import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

// Dev-only seeding endpoint. Wipes and reloads the demo dataset.
// Guarded twice: disabled in production, and requires an explicit confirm token
// so it can never be triggered accidentally (e.g. by a prefetch or crawler).
//   GET /api/seed?confirm=reset-demo-data
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in production" }, { status: 403 });
  }
  const confirm = new URL(request.url).searchParams.get("confirm");
  if (confirm !== "reset-demo-data") {
    return NextResponse.json(
      { error: "Add ?confirm=reset-demo-data to wipe and reseed the database." },
      { status: 400 },
    );
  }
  const result = await seedDatabase();
  return NextResponse.json({ ok: true, ...result });
}
