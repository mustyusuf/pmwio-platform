/**
 * Where to send someone after they log in. Only in-app dashboard paths are
 * allowed, so a crafted /login?next=... link can't bounce a user to another
 * website (open redirect). Anything else falls back to the dashboard home.
 */
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string") return "/dashboard";
  const path = value.trim();
  const ok = /^\/dashboard(\/[A-Za-z0-9\-_/]*)?$/.test(path) && !path.includes("//");
  return ok ? path : "/dashboard";
}

/** The page a member lands on every time they log in. */
export const MEMBER_HOME = "/dashboard/quran";

/**
 * Where a user goes after logging in. Members always land on the Qur'an
 * Challenge, wherever they signed in from; every other role goes to the page
 * they were heading to (if it's a safe in-app path) or the dashboard home.
 */
export function postLoginPath(role: string, next?: unknown): string {
  return role === "MEMBER" ? MEMBER_HOME : safeNextPath(next);
}
