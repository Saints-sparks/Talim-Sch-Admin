"use client";

import { CheckCircle } from "lucide-react";
import type { ConfirmedWithdrawal } from "@/app/services/finance.service";
import { ModalShell } from "../ModalShell";
import { WithdrawalStatusBadge } from "../FinanceBadges";
import { formatDateTime, formatNaira } from "../formatters";

interface WithdrawalSuccessStepProps {
  withdrawal: ConfirmedWithdrawal;
  onClose: () => void;
  onViewWithdrawals: () => void;
}

/**
 * Step 4: the receipt for a submitted withdrawal.
 *
 * Everything shown here comes from the confirm response, so the reference and
 * amounts are the server's record rather than the figures typed at step 1.
 *
 * @param props - The created withdrawal and the exit callbacks.
 * @returns The success step.
 */
export function WithdrawalSuccessStep({
  withdrawal,
  onClose,
  onViewWithdrawals,
}: WithdrawalSuccessStepProps) {
  const rows: [string, string][] = [
    ["Withdrawal Reference", withdrawal.reference],
    ["Requested Date", formatDateTime(withdrawal.requestedAt)],
    ["You Will Receive", formatNaira(withdrawal.amountToReceive)],
    ["Estimated Review Time", withdrawal.estimatedReviewTime],
  ];

  return (
    <ModalShell onClose={onClose}>
      <div className="p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-green-500" />
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-2">Withdrawal Request Submitted!</h3>
        <p className="text-sm text-gray-500 mb-5">
          Your withdrawal request of{" "}
          <span className="font-bold text-[#003366]">{formatNaira(withdrawal.amount)}</span> has
          been submitted successfully.
        </p>

        <WithdrawalStatusBadge status={withdrawal.status} />

        <p className="text-xs text-gray-400 mt-2 mb-6">
          We will send you an email once your withdrawal request has been reviewed.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-semibold text-gray-800 text-right">{value}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              onViewWithdrawals();
              onClose();
            }}
            className="flex-1 py-3 bg-[#003366] text-white rounded-xl text-sm font-bold hover:bg-[#003366]/90"
          >
            View Withdrawals
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600"
          >
            Back to Finance
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
