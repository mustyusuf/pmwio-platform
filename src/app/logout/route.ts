import { redirect } from "next/navigation";
import { destroySession } from "@/lib/session";

// GET /logout — clears the session cookie and returns home. Used as a safe
// place to log out from contexts where cookies can't be mutated (e.g. when a
// page render detects a stale session).
export async function GET() {
  await destroySession();
  redirect("/");
}
