// Shared formatting helpers (safe to use in both server and client components).

export function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

export function formatMoney(n: number) {
  return "₦" + Math.round(n).toLocaleString("en-NG");
}
