"use client";

import type { FeeLedgerStatus } from "@/app/services/fees.service";
import { Pill, type Tone } from "@/components/tl";
import { LEDGER_STATUS_LABELS } from "./partPayments";

/** Pill tone per ledger status: paid green, part paid amber, unpaid grey. */
const LEDGER_TONE: Record<FeeLedgerStatus, Tone> = {
  paid: "success",
  part_paid: "warning",
  unpaid: "muted",
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
    <Pill tone={LEDGER_TONE[status] ?? "muted"}>{LEDGER_STATUS_LABELS[status] ?? status}</Pill>
  );
}
