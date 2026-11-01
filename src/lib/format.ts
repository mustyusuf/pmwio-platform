// Shared formatting helpers (safe to use in both server and client components).

export function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(d));
}

export function formatMoney(n: number) {
  return "₦" + Math.round(n).toLocaleString("en-NG");
}

export function formatDateTime(d: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(d));
}
