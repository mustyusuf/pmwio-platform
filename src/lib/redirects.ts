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
