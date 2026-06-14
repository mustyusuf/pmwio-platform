// Application workflow statuses — labels, styling and grouping helpers.

export const STATUS_LABEL: Record<string, string> = {
  PENDING_REFEREE: "Awaiting referee",
  REFEREE_REJECTED: "Declined by referee",
  PENDING_BOARD: "Board review",
  PENDING_EXECUTIVE: "Executive decision",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  // Payment statuses
  PENDING: "Pending",
  COMPLETED: "Completed",
};

export const STATUS_STYLE: Record<string, string> = {
  PENDING_REFEREE: "bg-amber-100 text-amber-800",
  REFEREE_REJECTED: "bg-red-100 text-red-700",
  PENDING_BOARD: "bg-blue-100 text-blue-800",
  PENDING_EXECUTIVE: "bg-violet-100 text-violet-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-700",
  // Payment statuses
  PENDING: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
};

export const PENDING_STATUSES = ["PENDING_REFEREE", "PENDING_BOARD", "PENDING_EXECUTIVE"];
export const REJECTED_STATUSES = ["REJECTED", "REFEREE_REJECTED"];

export function isPending(status: string) {
  return PENDING_STATUSES.includes(status);
}
export function isApproved(status: string) {
  return status === "APPROVED";
}
export function isRejected(status: string) {
  return REJECTED_STATUSES.includes(status);
}
