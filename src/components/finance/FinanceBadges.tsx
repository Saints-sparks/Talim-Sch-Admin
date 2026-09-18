"use client";

import type { WalletEntryDirection, WithdrawalStatus } from "@/app/services/finance.service";

/** Palette per withdrawal status. Tailwind's own dark overrides handle the dark theme. */
const WITHDRAWAL_STYLES: Record<WithdrawalStatus, { className: string; label: string }> = {
  pending: { className: "bg-amber-50 text-amber-700", label: "Pending Review" },
  approved: { className: "bg-indigo-50 text-indigo-700", label: "Approved" },
  processing: { className: "bg-blue-50 text-blue-700", label: "Processing" },
  completed: { className: "bg-green-50 text-green-700", label: "Completed" },
  rejected: { className: "bg-red-50 text-red-600", label: "Rejected" },
  failed: { className: "bg-red-50 text-red-600", label: "Failed" },
  cancelled: { className: "bg-gray-100 text-gray-500", label: "Cancelled" },
};

/**
 * The status of a withdrawal request, in the same words the review email uses.
 *
 * @param props - The withdrawal's status.
 * @returns A status pill.
 */
export function WithdrawalStatusBadge({ status }: { status: string }) {
  const style = WITHDRAWAL_STYLES[status as WithdrawalStatus] ?? {
    className: "bg-gray-100 text-gray-500",
    label: status,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${style.className}`}
    >
      {style.label}
    </span>
  );
}

/** Palette for ledger entry states, wallet states and credit/debit direction. */
const LEDGER_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  posted: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  approved: "bg-indigo-100 text-indigo-700",
  completed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  failed: "bg-red-100 text-red-600",
  cancelled: "bg-gray-100 text-gray-500",
  suspended: "bg-orange-100 text-orange-600",
  closed: "bg-gray-100 text-gray-500",
  reversed: "bg-orange-100 text-orange-600",
  credit: "bg-green-100 text-green-700",
  debit: "bg-red-100 text-red-600",
};

/**
 * A ledger entry's state, a wallet's state, or a credit/debit direction.
 *
 * @param props - The value to colour, already lowercase as the API returns it.
 * @returns A status pill.
 */
export function LedgerStatusBadge({ status }: { status: string | WalletEntryDirection }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
        LEDGER_STYLES[status] ?? "bg-gray-100 text-gray-500 dark:text-slate-400"
      }`}
    >
      {status}
    </span>
  );
}
