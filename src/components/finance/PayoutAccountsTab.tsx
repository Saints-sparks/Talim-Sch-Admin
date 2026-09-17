"use client";

import { useState } from "react";
import { AlertCircle, Building2, CheckCircle, Plus } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { ErrorState } from "@/components/StateComponents";
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {accounts.length} account{accounts.length === 1 ? "" : "s"}
        </p>
        <PermissionGate permission={Permission.MANAGE_FINANCE}>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-xl text-sm font-semibold hover:bg-[#003366]/90"
          >
            <Plus size={15} /> Add Payout Account
          </button>
        </PermissionGate>
      </div>

      {query.isPending ? (
        <CardListSkeleton />
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Building2 size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">No payout accounts added</p>
          <p className="text-sm text-gray-400 mt-1">
            Add a verified business account to receive withdrawals
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => {
            const busy = busyId === account._id;
            return (
              <div
                key={account._id}
                className={`bg-white rounded-2xl border-2 p-5 ${
                  account.isDefault ? "border-[#003366]" : "border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E8EDF3] flex items-center justify-center shrink-0">
                      <Building2 size={18} className="text-[#003366]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-semibold text-gray-800">{account.bankName}</p>
                        {account.isDefault && (
                          <span className="text-xs bg-[#003366] text-white px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                        {account.isVerified ? (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle size={11} /> Verified
                          </span>
                        ) : (
                          <span className="text-xs text-orange-500 flex items-center gap-1">
                            <AlertCircle size={11} /> Unverified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{account.accountName}</p>
                      <p className="font-mono text-sm text-gray-500">
                        ·· {account.accountNumber.slice(-4)}
                      </p>
                    </div>
                  </div>

                  <PermissionGate permission={Permission.MANAGE_FINANCE}>
                    <div className="flex items-center gap-2 shrink-0">
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
                          className="text-xs px-3 py-1.5 border border-[#003366] text-[#003366] rounded-lg hover:bg-[#003366]/5 disabled:opacity-40"
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
                          className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                        >
                          {busy ? "Working…" : "Set Default"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPendingRemoval(account)}
                        disabled={busy}
                        className="text-xs px-3 py-1.5 text-red-500 border border-red-100 rounded-lg hover:bg-red-50 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </PermissionGate>
                </div>
              </div>
            );
          })}
        </div>
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
