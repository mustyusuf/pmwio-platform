import { headers } from "next/headers";

// ---------------------------------------------------------------------------
// In-memory sliding-window rate limiter for the public, unauthenticated
// endpoints (login, registration, password reset, contact, applications, ...).
// The app runs as a single Node process, so a per-process Map is enough; it
// resets on restart, which only ever makes the limits more forgiving.
// ---------------------------------------------------------------------------

type Bucket = number[]; // timestamps (ms) of recent hits

const globalForLimiter = globalThis as unknown as { rateBuckets?: Map<string, Bucket> };
const buckets = (globalForLimiter.rateBuckets ??= new Map<string, Bucket>());

const MAX_TRACKED_KEYS = 10_000;

/**
 * Records one hit for `key` and returns whether it is allowed: at most `limit`
 * hits per `windowMs`. Once over, further hits keep being refused until the
 * oldest ones age out of the window.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);

  // Housekeeping so a flood of distinct keys can't grow memory without bound.
  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [k, hits] of buckets) {
      if (hits.length === 0 || now - hits[hits.length - 1] > windowMs) buckets.delete(k);
      if (buckets.size <= MAX_TRACKED_KEYS / 2) break;
    }
  }
  return true;
}

/** Clears a key (e.g. after a successful login) so honest users aren't penalised. */
export function resetRateLimit(key: string) {
  buckets.delete(key);
}

/**
 * The caller's IP. Behind the reverse proxy the right-most X-Forwarded-For
 * entry is the one the proxy itself added; earlier entries are client-supplied
 * and trivially spoofed, so they are ignored.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return h.get("x-real-ip") ?? "unknown";
}

const MINUTE = 60_000;

/** Named limits, so the policy lives in one place. All are per client IP unless noted. */
export const LIMITS = {
  login: { limit: 20, windowMs: 15 * MINUTE },
  loginAccount: { limit: 8, windowMs: 15 * MINUTE }, // per account, whatever the IP
  register: { limit: 5, windowMs: 60 * MINUTE },
  passwordReset: { limit: 5, windowMs: 15 * MINUTE },
  verification: { limit: 5, windowMs: 15 * MINUTE },
  contact: { limit: 5, windowMs: 60 * MINUTE },
  apply: { limit: 10, windowMs: 60 * MINUTE },
  lookup: { limit: 30, windowMs: 15 * MINUTE }, // referee-ID checks
  donation: { limit: 10, windowMs: 15 * MINUTE },
  password: { limit: 10, windowMs: 15 * MINUTE }, // change-password attempts, per user
} as const;

export const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";

/** Checks a named per-IP limit. Returns true when the request may proceed. */
export async function allowFromIp(name: keyof typeof LIMITS): Promise<boolean> {
  const { limit, windowMs } = LIMITS[name];
  return rateLimit(`${name}:${await clientIp()}`, limit, windowMs);
}
