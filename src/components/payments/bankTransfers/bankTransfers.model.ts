/**
 * Pure rules for the bank-transfer reconciliation screen (C4), kept out of the
 * components so they are testable on their own.
 */
import { ApiError, getErrorMessage } from "@/lib/apiError";
import type { AdminBankTransfer, BankTransferStatus } from "@/app/services/payments.service";

/** Longest reason `RejectBankTransferDto` accepts. */
export const REJECT_REASON_MAX = 500;

/** Tab label per status. */
export const BANK_TRANSFER_TAB_LABELS: Record<BankTransferStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  rejected: "Rejected",
};

/** What each tab's empty state says. */
export const BANK_TRANSFER_EMPTY_COPY: Record<BankTransferStatus, string> = {
  pending: "No transfers are waiting. When a parent reports a bank transfer, it appears here.",
  confirmed: "No confirmed transfers yet.",
  rejected: "No rejected transfers.",
};

/**
 * The child's class, when the API sends it. The list route does not include
 * a class yet, so this falls back to an em dash rather than guessing.
 *
 * @param transfer - A transfer from the list.
 * @returns The class name, or "—".
 */
export function transferClassName(transfer: AdminBankTransfer): string {
  const name = transfer.child?.class?.name ?? transfer.child?.className ?? "";
  return name.trim() || "—";
}

/** One line of the confirm dialog's allocation preview. */
export interface AllocationLine {
  feeAssignmentId: string;
  label: string;
  /** Naira; null when the server could not price the line. */
  amount: number | null;
}

/** What confirming will do to the fees, as the confirm dialog shows it. */
export interface AllocationPreview {
  lines: AllocationLine[];
  /** Sum of the priced lines, in naira. */
  allocated: number;
  /** The transfer amount the lines do not account for (0 when they add up). */
  unallocated: number;
}

/**
 * The allocation the server made when the parent submitted the transfer, by
 * due date: what each fee receives once it is confirmed. Sums in kobo so
 * naira fractions never drift.
 *
 * @param transfer - The pending transfer.
 * @returns Its lines, their total and anything left unallocated.
 */
export function allocationPreview(transfer: AdminBankTransfer): AllocationPreview {
  const lines: AllocationLine[] = (transfer.items ?? []).map((item) => ({
    feeAssignmentId: item.feeAssignmentId,
    label: item.label?.trim() || "Fee",
    amount: typeof item.amount === "number" && Number.isFinite(item.amount) ? item.amount : null,
  }));
  const allocatedKobo = lines.reduce((sum, line) => sum + Math.round((line.amount ?? 0) * 100), 0);
  const totalKobo = Math.round((transfer.amount ?? 0) * 100);
  return {
    lines,
    allocated: allocatedKobo / 100,
    unallocated: Math.max(0, totalKobo - allocatedKobo) / 100,
  };
}

/**
 * Checks a rejection reason before it is sent: the parent sees it, so it may
 * not be blank, and the API caps it at {@link REJECT_REASON_MAX} characters.
 *
 * @param reason - What the admin typed.
 * @returns The message to show, or null when the reason is fine.
 */
export function validateRejectReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (!trimmed) return "Give a reason. The parent sees it.";
  if (trimmed.length > REJECT_REASON_MAX) {
    return `Keep the reason to ${REJECT_REASON_MAX} characters or fewer.`;
  }
  return null;
}

/**
 * Only http(s) links are rendered as a proof link; anything else (a blank or
 * a `javascript:` URL) is treated as no proof.
 *
 * @param url - The proof URL the parent supplied.
 * @returns The URL when it is safe to link, else null.
 */
export function safeProofUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Turns a failed confirm or reject into something the bursar can act on.
 *
 * @param error - Whatever the mutation threw.
 * @param action - Which decision failed.
 * @returns The message for the toast.
 */
export function bankTransferActionMessage(error: unknown, action: "confirm" | "reject"): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "INVALID_STATE_TRANSITION":
        return getErrorMessage(
          error,
          "Someone already decided this transfer. The list has been refreshed."
        );
      case "NOT_FOUND":
        return "This transfer no longer exists, or belongs to another school.";
      case "FORBIDDEN":
        return "You need the Manage Fees permission to decide bank transfers.";
      case "VALIDATION_FAILED": {
        const first = Object.values(error.fieldErrors())[0];
        if (first) return first;
        break;
      }
      default:
        break;
    }
  }
  return getErrorMessage(
    error,
    action === "confirm" ? "Couldn't confirm the transfer." : "Couldn't reject the transfer."
  );
}
