"use client";

import { useState } from "react";
import { AlertCircle, Building2, CheckCircle, Plus } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { ErrorState } from "@/components/StateComponents";
import {
  EmptyNote,
  Pill,
  card,
  cardFrame,
  dangerGhostButton,
  primaryButton,
  rowButton,
} from "@/components/tl";
import { cn } from "@/lib/utils";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import { logger } from "@/lib/logger";
import type { BankAccount } from "@/app/services/finance.service";
import { useBankAccounts } from "@/hooks/finance/useFinanceQueries";
import {
  useRemoveBankAccount,
  useSetDefaultBankAccount,
  useVerifyBankAccount,
} from "@/hooks/finance/useFinanceMutations";
import { AddBankAccountModal } from "./AddBankAccountModal";
import { CardListSkeleton } from "./FinanceSkeletons";
import { ConfirmDialog } from "./ModalShell";
import { describeFinanceError, financeActionMessage } from "./financeErrors";

/**
 * The school's payout accounts, and the actions that change them.
 *
 * Every action here moves where money lands, so all of them — adding,
 * verifying, promoting to default and removing — are behind
 * `manage:finance`. An admin without it sees the list read-only rather than
 * buttons that the API would refuse.
 *
 * @returns The payout accounts tab.
 */
export function PayoutAccountsTab() {
  const query = useBankAccounts();
  const verify = useVerifyBankAccount();
  const setDefault = useSetDefaultBankAccount();
  const remove = useRemoveBankAccount();

  const [showAdd, setShowAdd] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<BankAccount | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const accounts = query.data ?? [];

  /**
   * Runs one account action with its busy flag and toasts.
   *
   * @param accountId - The account being changed.
   * @param action - The request.
   * @param success - The toast on success.
   * @param failure - The fallback toast on failure.
   */
  const runAction = async (
    accountId: string,
    action: () => Promise<unknown>,
    success: string,
    failure: string
  ) => {
    setBusyId(accountId);
    try {
      await action();
      toast.success(success);
    } catch (error) {
      logger.error("finance", failure, error);
      toast.error(financeActionMessage(error, failure));
    } finally {
      setBusyId(null);
    }
  };

  /** Removes the account the admin confirmed. */
  const confirmRemoval = async () => {
    if (!pendingRemoval) return;
    await runAction(
      pendingRemoval._id,
      () => remove.mutateAsync(pendingRemoval._id),
      "Account removed",
      "Failed to remove the account"
    );
    setPendingRemoval(null);
  };

  if (query.isError) {
    const copy = describeFinanceError(query.error, "your payout accounts");
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-tl-muted">
          {accounts.length} account{accounts.length === 1 ? "" : "s"}
        </p>
        <PermissionGate permission={Permission.MANAGE_FINANCE}>
          <button type="button" onClick={() => setShowAdd(true)} className={primaryButton}>
            <Plus size={16} aria-hidden /> Add Payout Account
          </button>
        </PermissionGate>
      </div>

      {query.isPending ? (
        <CardListSkeleton />
      ) : accounts.length === 0 ? (
        <div className={cardFrame}>
          <EmptyNote icon={<Building2 />} title="No payout accounts added">
            Add a verified business account to receive withdrawals
          </EmptyNote>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {accounts.map((account) => {
            const busy = busyId === account._id;
            return (
              <li
                key={account._id}
                className={cn(card, account.isDefault && "border-tl-brand ring-1 ring-tl-brand")}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tl-select text-tl-brand"
                    >
                      <Building2 size={19} />
                    </span>
                    <div className="min-w-0">
                      <div className="mb-0.5 flex flex-wrap items-center gap-2">
                        <p className="font-extrabold text-tl-ink">{account.bankName}</p>
                        {account.isDefault && <Pill tone="info">Default</Pill>}
                        {account.isVerified ? (
                          <Pill tone="success">
                            <CheckCircle size={12} aria-hidden /> Verified
                          </Pill>
                        ) : (
                          <Pill tone="warning">
                            <AlertCircle size={12} aria-hidden /> Unverified
                          </Pill>
                        )}
                      </div>
                      <p className="text-sm text-tl-body">{account.accountName}</p>
                      <p className="font-mono text-sm text-tl-muted">
                        ·· {account.accountNumber.slice(-4)}
                      </p>
                    </div>
                  </div>

                  <PermissionGate permission={Permission.MANAGE_FINANCE}>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {!account.isVerified && (
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              account._id,
                              () => verify.mutateAsync(account._id),
                              "Account verified with the bank",
                              "Verification failed"
                            )
                          }
                          disabled={busy}
                          className={rowButton}
                        >
                          {busy ? "Working…" : "Verify"}
                        </button>
                      )}
                      {account.isVerified && !account.isDefault && (
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              account._id,
                              () => setDefault.mutateAsync(account._id),
                              "Default account updated",
                              "Failed to set the default account"
                            )
                          }
                          disabled={busy}
                          className={rowButton}
                        >
                          {busy ? "Working…" : "Set Default"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPendingRemoval(account)}
                        disabled={busy}
                        className={dangerGhostButton}
                      >
                        Remove
                      </button>
                    </div>
                  </PermissionGate>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showAdd && <AddBankAccountModal onClose={() => setShowAdd(false)} />}

      {pendingRemoval && (
        <ConfirmDialog
          title="Remove this payout account?"
          message={`${pendingRemoval.bankName} · ${pendingRemoval.accountName} will no longer be available for withdrawals. An account with a pending withdrawal cannot be removed.`}
          confirmLabel="Remove account"
          destructive
          busy={remove.isPending}
          onConfirm={() => void confirmRemoval()}
          onCancel={() => setPendingRemoval(null)}
        />
      )}
    </div>
  );
}
