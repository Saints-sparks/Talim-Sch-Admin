"use client";

import { useState } from "react";
import { ArrowUpCircle, Banknote, RefreshCw, X } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { ErrorState } from "@/components/StateComponents";
import {
  CardHeader,
  EmptyNote,
  Segmented,
  cardFrame,
  dangerGhostButton,
  iconButton,
  primaryButton,
  table,
  tableScroll,
  td,
  th,
  theadRow,
  tr,
} from "@/components/tl";
import { cn } from "@/lib/utils";
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

/** The table's column headings. */
const COLUMNS = ["Reference", "Amount", "Bank Account", "Status", "Requested Date", "Actions"];

/**
 * The school's withdrawal history, filtered by status and paged on the server.
 *
 * Cancelling is only offered for a withdrawal still in a cancellable state —
 * the server refuses once review has started, and the button is hidden
 * entirely from an admin without `manage:finance`.
 *
 * @param props - Callback that opens the withdrawal flow.
 * @param props.onNewWithdrawal - Opens the withdrawal flow.
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

  /** Cancels the withdrawal the admin confirmed, and says so. */
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
    <div className="flex flex-col gap-[18px]">
      <CardHeader
        title="Withdrawals"
        subtitle="Track all withdrawal requests and their status."
        actions={
          <>
            <button
              type="button"
              onClick={() => void query.refetch()}
              aria-label="Refresh withdrawals"
              className={`${iconButton} border border-tl-control bg-tl-surface`}
            >
              <RefreshCw
                size={16}
                aria-hidden
                className={query.isFetching ? "animate-spin text-tl-brand" : undefined}
              />
            </button>
            <PermissionGate permission={Permission.MANAGE_FINANCE}>
              <button type="button" onClick={onNewWithdrawal} className={primaryButton}>
                <ArrowUpCircle size={16} aria-hidden /> Withdraw Funds
              </button>
            </PermissionGate>
          </>
        }
      />

      <Segmented
        options={STATUS_FILTERS}
        value={status}
        onChange={(next) => {
          setStatus(next);
          setPage(1);
        }}
        label="Show withdrawals that are"
      />

      <div className={cardFrame}>
        {!query.isPending && withdrawals.length === 0 ? (
          <EmptyNote icon={<Banknote />} title="No withdrawals found">
            {status ? "No withdrawals with this status" : "Your withdrawal history will appear here"}
          </EmptyNote>
        ) : (
          <div className={tableScroll}>
            <table className={cn(table, "min-w-[820px]")}>
              <thead>
                <tr className={theadRow}>
                  {COLUMNS.map((column) => (
                    <th key={column} className={th}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody aria-busy={query.isPending || undefined}>
                {query.isPending ? (
                  <TableSkeleton columns={COLUMNS.length} />
                ) : (
                  withdrawals.map((withdrawal) => {
                    const account =
                      typeof withdrawal.bankAccountId === "object" ? withdrawal.bankAccountId : null;
                    const cancellable = CANCELLABLE_WITHDRAWAL_STATUSES.includes(withdrawal.status);
                    return (
                      <tr key={withdrawal._id} className={tr}>
                        <td className={cn(td, "font-mono text-xs font-bold text-tl-brand")}>
                          {withdrawal.reference}
                        </td>
                        <td className={cn(td, "whitespace-nowrap font-extrabold text-tl-ink")}>
                          {formatNaira(withdrawal.amount)}
                        </td>
                        <td className={td}>
                          {account
                            ? `${account.bankName} · ${maskAccountNumber(account.accountNumber)}`
                            : "—"}
                        </td>
                        <td className={td}>
                          <WithdrawalStatusBadge status={withdrawal.status} />
                        </td>
                        <td className={cn(td, "whitespace-nowrap text-[13px] text-tl-muted")}>
                          {formatDateTime(withdrawal.createdAt)}
                        </td>
                        <td className={cn(td, "py-1.5")}>
                          {cancellable ? (
                            <PermissionGate
                              permission={Permission.MANAGE_FINANCE}
                              fallback={<span className="text-sm text-tl-faint">—</span>}
                            >
                              <button
                                type="button"
                                onClick={() => setPendingCancel(withdrawal)}
                                disabled={cancel.isPending}
                                className={dangerGhostButton}
                              >
                                <X size={14} aria-hidden /> Cancel
                              </button>
                            </PermissionGate>
                          ) : (
                            <span className="text-sm text-tl-faint">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
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
