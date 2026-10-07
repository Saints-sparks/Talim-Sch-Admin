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
  requested: "bg-tl-warning-bg text-tl-warning border-tl-warning/30",
  source_approved: "bg-tl-select text-tl-link border-tl-control",
  target_approved: "bg-tl-select text-tl-accent border-tl-control",
  accepted: "bg-tl-success-bg text-tl-success border-tl-success/30",
  rejected: "bg-tl-danger-bg text-tl-danger border-tl-danger/30",
  cancelled: "bg-tl-track text-tl-muted border-tl-line",
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
