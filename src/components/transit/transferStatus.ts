/**
 * How a transfer's status is spelled and coloured, shared by the list and the
 * detail page so one status never reads two different ways.
 */
import type { TransferStatus } from "@/app/services/transit.service";

/** The label shown for each status. */
export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  requested: "Requested",
  source_approved: "Source Approved",
  target_approved: "Target Approved",
  accepted: "Accepted",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

/** Badge colours per status, in both themes. */
export const TRANSFER_STATUS_COLORS: Record<TransferStatus, string> = {
  requested:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  source_approved:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
  target_approved:
    "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30",
  accepted:
    "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30",
  rejected:
    "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
  cancelled:
    "bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
};

/** The happy path, in order, for the progress stepper. */
export const TRANSFER_STEPS: { status: TransferStatus; label: string }[] = [
  { status: "requested", label: "Requested" },
  { status: "source_approved", label: "Source Approved" },
  { status: "target_approved", label: "Target Approved" },
  { status: "accepted", label: "Accepted" },
];

/**
 * How far along the happy path a transfer is.
 *
 * @param status - The transfer's status.
 * @returns The step index, or -1 for a transfer that left the path.
 */
export function transferStepIndex(status: TransferStatus): number {
  if (status === "rejected" || status === "cancelled") return -1;
  return TRANSFER_STEPS.findIndex((step) => step.status === status);
}

/**
 * Formats a timestamp for the transit pages.
 *
 * @param value - An ISO date string, or nothing.
 * @param withTime - Whether to include the time of day.
 * @returns The formatted date, or a dash.
 */
export function formatTransitDate(value?: string | null, withTime = false): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
