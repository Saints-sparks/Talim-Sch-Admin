"use client";

import type { FeeLedgerStatus } from "@/app/services/fees.service";
import { LEDGER_STATUS_LABELS } from "./partPayments";

/** Pill colours per ledger status; each pair meets 4.5:1 in both themes. */
const LEDGER_BADGE: Record<FeeLedgerStatus, string> = {
  paid: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  part_paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  unpaid: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
};

/**
 * A fee's ledger status for one child: Paid, Part paid or Unpaid.
 *
 * @param props - The status from the fee ledger.
 * @param props.status - `paid`, `part_paid` or `unpaid`.
 * @returns The pill.
 */
export function LedgerStatusBadge({ status }: { status: FeeLedgerStatus }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${LEDGER_BADGE[status] ?? LEDGER_BADGE.unpaid}`}
    >
      {LEDGER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
