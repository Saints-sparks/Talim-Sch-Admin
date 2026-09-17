"use client";

import { useState } from "react";
import { ArrowUpCircle, Banknote, RefreshCw, X } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { ErrorState } from "@/components/StateComponents";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import { logger } from "@/lib/logger";
import {
  CANCELLABLE_WITHDRAWAL_STATUSES,
  type WithdrawalRequest,
  type WithdrawalStatus,
} from "@/app/services/finance.service";
import { useWithdrawals } from "@/hooks/finance/useFinanceQueries";
import { useCancelWithdrawal } from "@/hooks/finance/useFinanceMutations";
import { WithdrawalStatusBadge } from "./FinanceBadges";
import { TableSkeleton } from "./FinanceSkeletons";
import { ConfirmDialog } from "./ModalShell";
import { TablePager } from "./TablePager";
import { describeFinanceError, financeActionMessage } from "./financeErrors";
import { formatDateTime, formatNaira, maskAccountNumber } from "./formatters";
import { FINANCE_PAGE_SIZE } from "./tabs";

/** Status tabs, covering every `WithdrawalStatus` the backend can return. */
const STATUS_FILTERS: { value: WithdrawalStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

const COLUMNS = ["Reference", "Amount", "Bank Account", "Status", "Requested Date", "Actions"];

/**
 * The school's withdrawal history, filtered by status and paged on the server.
 *
 * Cancelling is only offered for a withdrawal still in a cancellable state —
 * the server refuses once review has started, and the button is hidden
 * entirely from an admin without `manage:finance`.
 *
 * @param props - Callback that opens the withdrawal flow.
 * @returns The withdrawals tab.
 */
export function WithdrawalsTab({ onNewWithdrawal }: { onNewWithdrawal: () => void }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<WithdrawalStatus | "">("");
  const [pendingCancel, setPendingCancel] = useState<WithdrawalRequest | null>(null);

  const query = useWithdrawals({ page, limit: FINANCE_PAGE_SIZE, status: status || undefined });
  const cancel = useCancelWithdrawal();

  const withdrawals = query.data?.data ?? [];
  const total = query.data?.pagination?.total ?? 0;

  const confirmCancel = async () => {
    if (!pendingCancel) return;
    try {
      await cancel.mutateAsync(pendingCancel._id);
      toast.success("Withdrawal cancelled — the funds are back in your available balance");
      setPendingCancel(null);
    } catch (error) {
      logger.error("finance", "cancel withdrawal failed", error);
      toast.error(financeActionMessage(error, "Failed to cancel the withdrawal"));
    }
  };

  if (query.isError) {
    const copy = describeFinanceError(query.error, "your withdrawals");
    return (
      <ErrorState
        title={copy.title}
        message={copy.message}
        onRetry={copy.retryable ? () => void query.refetch() : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Withdrawals</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Track all withdrawal requests and their status.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-6 overflow-x-auto border-b border-gray-100">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value || "all"}
              type="button"
              onClick={() => {
                setStatus(filter.value);
                setPage(1);
              }}
              className={`py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                status === filter.value
                  ? "border-[#003366] text-[#003366]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void query.refetch()}
            aria-label="Refresh withdrawals"
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <RefreshCw
              size={15}
              className={query.isFetching ? "animate-spin text-[#003366]" : "text-gray-500"}
            />
          </button>
          <PermissionGate permission={Permission.MANAGE_FINANCE}>
            <button
              type="button"
              onClick={onNewWithdrawal}
              className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-xl text-sm font-semibold hover:bg-[#003366]/90"
            >
              <ArrowUpCircle size={15} /> Withdraw Funds
            </button>
          </PermissionGate>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {COLUMNS.map((column) => (
                  <th
                    key={column}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {query.isPending ? (
                <TableSkeleton columns={COLUMNS.length} />
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-16 text-center">
                    <Banknote size={36} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No withdrawals found</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {status
                        ? "No withdrawals with this status"
                        : "Your withdrawal history will appear here"}
                    </p>
                  </td>
                </tr>
              ) : (
                withdrawals.map((withdrawal) => {
                  const account =
                    typeof withdrawal.bankAccountId === "object" ? withdrawal.bankAccountId : null;
                  const cancellable = CANCELLABLE_WITHDRAWAL_STATUSES.includes(withdrawal.status);
                  return (
                    <tr key={withdrawal._id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#003366]">
                        {withdrawal.reference}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {formatNaira(withdrawal.amount)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {account
                          ? `${account.bankName} · ${maskAccountNumber(account.accountNumber)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <WithdrawalStatusBadge status={withdrawal.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {formatDateTime(withdrawal.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {cancellable ? (
                          <PermissionGate
                            permission={Permission.MANAGE_FINANCE}
                            fallback={<span className="text-xs text-gray-400">—</span>}
                          >
                            <button
                              type="button"
                              onClick={() => setPendingCancel(withdrawal)}
                              disabled={cancel.isPending}
                              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-red-500 hover:border-red-100 disabled:opacity-40"
                            >
                              <X size={13} /> Cancel
                            </button>
                          </PermissionGate>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TablePager
        page={page}
        pageSize={FINANCE_PAGE_SIZE}
        total={total}
        busy={query.isFetching}
        onChange={setPage}
      />

      {pendingCancel && (
        <ConfirmDialog
          title="Cancel this withdrawal?"
          message={`${formatNaira(pendingCancel.amount)} (${pendingCancel.reference}) goes straight back into your available balance. This cannot be undone — you would need to start a new withdrawal.`}
          confirmLabel="Cancel withdrawal"
          destructive
          busy={cancel.isPending}
          onConfirm={() => void confirmCancel()}
          onCancel={() => setPendingCancel(null)}
        />
      )}
    </div>
  );
}
