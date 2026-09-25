// Small helpers for scheduling jobs against Nigeria's clock (Africa/Lagos,
// UTC+1 year-round — no DST) regardless of the server host's own timezone.

const TZ = "Africa/Lagos";

/** The current hour (0-23) in Africa/Lagos. */
export function lagosHour(date: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "2-digit", hour12: false }).format(date)) % 24;
}

/** "YYYY-MM-DD" for the given instant, as a calendar date in Africa/Lagos. */
export function lagosDateKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** Whether two instants fall on the same Africa/Lagos calendar day. */
export function isSameLagosDay(a: Date, b: Date = new Date()): boolean {
  return lagosDateKey(a) === lagosDateKey(b);
}

/** Whole Africa/Lagos calendar days between two instants (b - a). */
export function lagosDaysBetween(a: Date, b: Date = new Date()): number {
  const asUtcMidnight = (d: Date) => Date.parse(`${lagosDateKey(d)}T00:00:00Z`);
  return Math.round((asUtcMidnight(b) - asUtcMidnight(a)) / (24 * 60 * 60 * 1000));
}
