"use client";

import Link from "next/link";
import { Landmark } from "lucide-react";
import { ghostButton } from "@/components/tl";
import {
  useCanReconcileBankTransfers,
  usePendingBankTransferCount,
} from "@/hooks/finance/useBankTransfers";

/**
 * The way into bank-transfer reconciliation from the Fees and Payments pages,
 * with the number of transfers waiting. Renders nothing for an admin without
 * `manage:fees` (the routes' permission), so a payments-only sub-admin is not
 * sent to a page they cannot open.
 *
 * @returns The link, or null.
 */
export function BankTransfersLink() {
  const canReconcile = useCanReconcileBankTransfers();
  const pending = usePendingBankTransferCount();
  if (!canReconcile) return null;

  const waiting = pending ?? 0;
  return (
    <Link
      href="/fees-management/bank-transfers"
      aria-label={waiting > 0 ? `Bank transfers, ${waiting} waiting` : undefined}
      className={ghostButton}
    >
      <Landmark size={16} aria-hidden />
      Bank transfers
      {waiting > 0 && (
        <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-tl-warning-bg px-1.5 text-xs font-extrabold text-tl-warning">
          {waiting}
        </span>
      )}
    </Link>
  );
}
