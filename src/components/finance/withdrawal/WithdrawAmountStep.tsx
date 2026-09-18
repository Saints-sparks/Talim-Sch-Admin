"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, CheckCircle, ChevronRight, RefreshCw, Shield } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { logger } from "@/lib/logger";
import {
  WITHDRAWAL_LIMITS,
  type BankAccount,
  type WalletSummary,
} from "@/app/services/finance.service";
import { useInitiateWithdrawal } from "@/hooks/finance/useFinanceMutations";
import { ModalShell } from "../ModalShell";
import { financeActionMessage } from "../financeErrors";
import { amountInWords, formatNaira } from "../formatters";

/**
 * Platform charge on a withdrawal. The backend sets this to zero today and
 * returns the authoritative figure with the verified summary, so this is only
 * the preview shown before the code is sent.
 */
const PLATFORM_CHARGE_PREVIEW = 0;

interface WithdrawAmountStepProps {
  accounts: BankAccount[];
  summary: WalletSummary | undefined;
  onClose: () => void;
  /** Hands the draft to the OTP step. */
  onDraftCreated: (draftId: string, maskedEmail: string) => void;
}

/**
 * Step 1: pick a verified payout account and an amount, then send the code.
 *
 * Client-side checks mirror the server's `InitiateWithdrawalDto` exactly —
 * a ₦10,000 minimum, no more than the available balance, and the ₦2,000,000
 * daily limit — so an impossible amount is caught before an OTP email goes
 * out. The server still decides.
 *
 * @param props - Accounts, balances and the step's callbacks.
 * @returns The amount step.
 */
export function WithdrawAmountStep({
  accounts,
  summary,
  onClose,
  onDraftCreated,
}: WithdrawAmountStepProps) {
  const initiate = useInitiateWithdrawal();
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const verifiedAccounts = useMemo(
    () => accounts.filter((account) => account.isVerified && account.status === "active"),
    [accounts]
  );
  // Start on the default account, or the only one there is.
  const preselectedId = useMemo(() => {
    const preferred =
      verifiedAccounts.find((account) => account.isDefault) ??
      (verifiedAccounts.length === 1 ? verifiedAccounts[0] : undefined);
    return preferred?._id ?? "";
  }, [verifiedAccounts]);
  const available = summary?.availableBalance ?? 0;
  const amountValue = Number.parseFloat(amount) || 0;
  const youReceive = amountValue - PLATFORM_CHARGE_PREVIEW;

  useEffect(() => {
    if (!accountId && preselectedId) setAccountId(preselectedId);
  }, [accountId, preselectedId]);

  const tooSmall = amountValue > 0 && amountValue < WITHDRAWAL_LIMITS.min;
  const tooLarge = amountValue > available;
  const overDailyLimit = amountValue > WITHDRAWAL_LIMITS.daily;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (tooSmall) {
      toast.error(`Minimum withdrawal is ${formatNaira(WITHDRAWAL_LIMITS.min)}`);
      return;
    }
    if (tooLarge) {
      toast.error("Amount exceeds available balance");
      return;
    }
    if (overDailyLimit) {
      toast.error(`Daily limit is ${formatNaira(WITHDRAWAL_LIMITS.daily)}`);
      return;
    }

    try {
      const draft = await initiate.mutateAsync({
        bankAccountId: accountId,
        amount: amountValue,
        note: note || undefined,
      });
      onDraftCreated(draft.withdrawalDraftId, draft.maskedEmail);
    } catch (error) {
      logger.error("finance", "initiate withdrawal failed", error);
      toast.error(financeActionMessage(error, "Failed to start the withdrawal"));
    }
  };

  const canSubmit =
    !initiate.isPending &&
    Boolean(accountId) &&
    amountValue >= WITHDRAWAL_LIMITS.min &&
    !tooLarge &&
    !overDailyLimit;

  return (
    <ModalShell title="Withdraw Funds" onClose={onClose}>
      {verifiedAccounts.length === 0 ? (
        <div className="p-8 text-center">
          <AlertCircle size={40} className="text-orange-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-700 dark:text-slate-200">No verified payout accounts</p>
          <p className="text-sm text-gray-400 mt-1">
            Add a bank account and verify it before withdrawing
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <p className="text-xs text-gray-400 mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-[#003366]">{formatNaira(available)}</p>
          </div>

          <div>
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1.5 block">Withdraw to</span>
            <div className="space-y-2">
              {verifiedAccounts.map((account) => (
                <label
                  key={account._id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    accountId === account._id
                      ? "border-[#003366] bg-[#003366]/5"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="withdrawal-account"
                    value={account._id}
                    checked={accountId === account._id}
                    onChange={() => setAccountId(account._id)}
                    className="sr-only"
                  />
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Building2 size={15} className="text-gray-600 dark:text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                      {account.bankName} · {account.accountNumber}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{account.accountName}</p>
                  </div>
                  {account.isDefault && (
                    <span className="text-xs bg-[#003366] text-white px-2 py-0.5 rounded-full shrink-0">
                      Default
                    </span>
                  )}
                  <CheckCircle
                    size={16}
                    className={
                      accountId === account._id ? "text-[#003366] shrink-0" : "text-gray-200 shrink-0"
                    }
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="withdrawal-amount"
              className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1.5 block"
            >
              Amount to Withdraw
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 font-bold text-sm">
                ₦
              </span>
              <input
                id="withdrawal-amount"
                type="number"
                min={WITHDRAWAL_LIMITS.min}
                max={available}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-200 dark:border-slate-700 rounded-xl pl-7 pr-3 py-3 text-lg font-semibold bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
                required
              />
            </div>
            {amountValue > 0 && (
              <p className="text-xs text-gray-400 mt-1 italic">{amountInWords(amountValue)}</p>
            )}
            {tooSmall && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> Minimum withdrawal is {formatNaira(WITHDRAWAL_LIMITS.min)}
              </p>
            )}
            {tooLarge && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> Exceeds available balance
              </p>
            )}
            {!tooLarge && overDailyLimit && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> Over the {formatNaira(WITHDRAWAL_LIMITS.daily)} daily limit
              </p>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 space-y-1">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Minimum withdrawal:{" "}
              <span className="font-semibold text-gray-700 dark:text-slate-200">
                {formatNaira(WITHDRAWAL_LIMITS.min)}
              </span>
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Daily withdrawal limit:{" "}
              <span className="font-semibold text-gray-700 dark:text-slate-200">
                {formatNaira(WITHDRAWAL_LIMITS.daily)}
              </span>
            </p>
          </div>

          {amountValue > 0 && (
            <div className="bg-[#003366]/5 rounded-xl p-4 space-y-2 border border-[#003366]/10">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-400">Platform charge</span>
                <span className="font-medium text-gray-800 dark:text-slate-100">
                  {formatNaira(PLATFORM_CHARGE_PREVIEW)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-[#003366] border-t border-[#003366]/10 pt-2 mt-1">
                <span>You will receive</span>
                <span>{formatNaira(youReceive)}</span>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="withdrawal-note"
              className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1.5 block"
            >
              Note <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="withdrawal-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Monthly operational expenses"
              maxLength={250}
              rows={2}
              className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#003366]/30 resize-none"
            />
          </div>

          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Shield size={11} /> A verification code will be sent to your email to confirm this
            withdrawal.
          </p>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 bg-[#003366] text-white rounded-xl text-sm font-bold hover:bg-[#003366]/90 disabled:opacity-40 transition flex items-center justify-center gap-2"
          >
            {initiate.isPending ? (
              <>
                <RefreshCw size={15} className="animate-spin" /> Sending OTP…
              </>
            ) : (
              <>
                Continue <ChevronRight size={16} />
              </>
            )}
          </button>
        </form>
      )}
    </ModalShell>
  );
}
