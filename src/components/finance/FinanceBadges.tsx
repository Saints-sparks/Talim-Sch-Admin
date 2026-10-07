"use client";

import type { WalletEntryDirection, WithdrawalStatus } from "@/app/services/finance.service";
import { Pill, type Tone } from "@/components/tl";

/** Tone and words per withdrawal status. */
const WITHDRAWAL_STYLES: Record<WithdrawalStatus, { tone: Tone; label: string }> = {
  pending: { tone: "warning", label: "Pending Review" },
  approved: { tone: "accent", label: "Approved" },
  processing: { tone: "info", label: "Processing" },
  completed: { tone: "success", label: "Completed" },
  rejected: { tone: "danger", label: "Rejected" },
  failed: { tone: "danger", label: "Failed" },
  cancelled: { tone: "muted", label: "Cancelled" },
};

/**
 * The status of a withdrawal request, in the same words the review email uses.
 *
 * @param props - The withdrawal's status.
 * @param props.status - The status as the API returns it.
 * @returns A status pill.
 */
export function WithdrawalStatusBadge({ status }: { status: string }) {
  const style = WITHDRAWAL_STYLES[status as WithdrawalStatus] ?? {
    tone: "muted" as const,
    label: status,
  };
  return (
    <Pill tone={style.tone} className="capitalize">
      {style.label}
    </Pill>
  );
}

/** Tone for ledger entry states, wallet states and credit/debit direction. */
const LEDGER_TONES: Record<string, Tone> = {
  active: "success",
  posted: "success",
  pending: "info",
  processing: "info",
  approved: "accent",
  completed: "success",
  rejected: "danger",
  failed: "danger",
  cancelled: "muted",
  suspended: "warning",
  closed: "muted",
  reversed: "warning",
  credit: "success",
  debit: "danger",
};

/**
 * A ledger entry's state, a wallet's state, or a credit/debit direction.
 *
 * @param props - The value to colour, already lowercase as the API returns it.
 * @param props.status - The value.
 * @returns A status pill.
 */
export function LedgerStatusBadge({ status }: { status: string | WalletEntryDirection }) {
  return (
    <Pill tone={LEDGER_TONES[status] ?? "muted"} className="capitalize">
      {status}
    </Pill>
  );
}
