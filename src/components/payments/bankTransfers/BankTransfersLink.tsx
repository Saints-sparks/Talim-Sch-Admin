"use client";

import Link from "next/link";
import { Landmark } from "lucide-react";
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
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
    >
      <Landmark size={15} aria-hidden />
      Bank transfers
      {waiting > 0 && (
        <span className="min-w-[1.25rem] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 text-xs font-semibold">
          {waiting}
        </span>
      )}
    </Link>
  );
}
