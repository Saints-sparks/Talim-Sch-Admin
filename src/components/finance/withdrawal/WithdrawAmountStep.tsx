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
import {
  EmptyNote,
  Pill,
  fieldControl,
  fieldError,
  fieldLabel,
  primaryButton,
  textareaControl,
} from "@/components/tl";
import { cn } from "@/lib/utils";
import { ModalShell } from "../ModalShell";
import { WithdrawalSteps, withdrawalStepEyebrow } from "./WithdrawalSteps";
import { financeActionMessage } from "../financeErrors";
import { amountInWords, formatNaira } from "../formatters";

/**
 * Platform charge on a withdrawal. The backend sets this to zero today and
 * returns the authoritative figure with the verified summary, so this is only
 * the preview shown before the code is sent.
 */
const PLATFORM_CHARGE_PREVIEW = 0;

/** Props for {@link WithdrawAmountStep}. */
interface WithdrawAmountStepProps {
  /** The school's payout accounts. */
  accounts: BankAccount[];
  /** Balances, for the available figure. */
  summary: WalletSummary | undefined;
  /** Closes the flow. */
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
 * @param props.accounts - The payout accounts.
 * @param props.summary - The balances.
 * @param props.onClose - Closes the flow.
 * @param props.onDraftCreated - Hands the draft on.
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

  /**
   * Checks the amount and creates the draft, which emails the code.
   *
   * @param event - The form's submit event.
   */
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
    <ModalShell title="Withdraw Funds" eyebrowText={withdrawalStepEyebrow(0)} onClose={onClose}>
      {verifiedAccounts.length === 0 ? (
        <EmptyNote
          icon={<AlertCircle className="text-tl-warning" />}
          title="No verified payout accounts"
        >
          Add a bank account and verify it before withdrawing
        </EmptyNote>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 px-[clamp(20px,3vw,28px)] py-5"
        >
          <WithdrawalSteps current={0} />

          <div className="rounded-2xl border border-tl-control bg-tl-select px-4 py-3.5">
            <p className="text-xs font-extrabold uppercase tracking-[0.05em] text-tl-brand">
              Available Balance
            </p>
            <p className="mt-1 text-[28px] font-extrabold tracking-[-0.5px] text-tl-brand">
              {formatNaira(available)}
            </p>
          </div>

          <fieldset>
            <legend className={`${fieldLabel} mb-1.5`}>Withdraw to</legend>
            <div className="flex flex-col gap-2">
              {verifiedAccounts.map((account) => {
                const chosen = accountId === account._id;
                return (
                  <label
                    key={account._id}
                    className={`flex min-h-[56px] cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-tl-link ${
                      chosen
                        ? "border-tl-control bg-tl-select"
                        : "border-tl-line bg-tl-surface hover:bg-tl-subtle"
                    }`}
                  >
                    <input
                      type="radio"
                      name="withdrawal-account"
                      value={account._id}
                      checked={chosen}
                      onChange={() => setAccountId(account._id)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tl-track text-tl-muted"
                    >
                      <Building2 size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-tl-ink">
                        {account.bankName} · {account.accountNumber}
                      </p>
                      <p className="truncate text-[13px] text-tl-muted">{account.accountName}</p>
                    </div>
                    {account.isDefault && <Pill tone="info">Default</Pill>}
                    <CheckCircle
                      size={18}
                      aria-hidden
                      className={chosen ? "shrink-0 text-tl-brand" : "shrink-0 text-tl-line"}
                    />
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="withdrawal-amount" className={`${fieldLabel} mb-1.5 block`}>
              Amount to Withdraw
            </label>
            <div className="relative">
              <span
                aria-hidden
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-extrabold text-tl-muted"
              >
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
                aria-invalid={tooSmall || tooLarge || overDailyLimit || undefined}
                className={cn(fieldControl, "min-h-[52px] pl-8 text-lg font-extrabold")}
                required
              />
            </div>
            {amountValue > 0 && (
              <p className="mt-1.5 text-[13px] italic text-tl-muted">{amountInWords(amountValue)}</p>
            )}
            {tooSmall && (
              <p className={`${fieldError} mt-1.5 flex items-center gap-1.5`}>
                <AlertCircle size={14} aria-hidden /> Minimum withdrawal is{" "}
                {formatNaira(WITHDRAWAL_LIMITS.min)}
              </p>
            )}
            {tooLarge && (
              <p className={`${fieldError} mt-1.5 flex items-center gap-1.5`}>
                <AlertCircle size={14} aria-hidden /> Exceeds available balance
              </p>
            )}
            {!tooLarge && overDailyLimit && (
              <p className={`${fieldError} mt-1.5 flex items-center gap-1.5`}>
                <AlertCircle size={14} aria-hidden /> Over the{" "}
                {formatNaira(WITHDRAWAL_LIMITS.daily)} daily limit
              </p>
            )}
          </div>

          <dl className="flex flex-col gap-1 rounded-2xl border border-tl-line-soft bg-tl-subtle px-4 py-3 text-[13px]">
            <div className="flex justify-between gap-3">
              <dt className="text-tl-muted">Minimum withdrawal:</dt>
              <dd className="font-bold text-tl-body">{formatNaira(WITHDRAWAL_LIMITS.min)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-tl-muted">Daily withdrawal limit:</dt>
              <dd className="font-bold text-tl-body">{formatNaira(WITHDRAWAL_LIMITS.daily)}</dd>
            </div>
          </dl>

          {amountValue > 0 && (
            <dl className="flex flex-col gap-2 rounded-2xl border border-tl-control bg-tl-select px-4 py-3.5">
              <div className="flex justify-between text-sm">
                <dt className="text-tl-body">Platform charge</dt>
                <dd className="font-bold text-tl-ink">{formatNaira(PLATFORM_CHARGE_PREVIEW)}</dd>
              </div>
              <div className="mt-1 flex justify-between border-t border-tl-control pt-2 font-extrabold text-tl-brand">
                <dt>You will receive</dt>
                <dd>{formatNaira(youReceive)}</dd>
              </div>
            </dl>
          )}

          <div>
            <label htmlFor="withdrawal-note" className={`${fieldLabel} mb-1.5 block`}>
              Note <span className="font-medium text-tl-faint">(optional)</span>
            </label>
            <textarea
              id="withdrawal-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Monthly operational expenses"
              maxLength={250}
              rows={2}
              className={cn(textareaControl, "min-h-[80px] resize-none text-sm")}
            />
          </div>

          <p className="flex items-start gap-1.5 text-[13px] text-tl-muted">
            <Shield size={14} aria-hidden className="mt-0.5 shrink-0" /> A verification code will
            be sent to your email to confirm this withdrawal.
          </p>

          <button type="submit" disabled={!canSubmit} className={`${primaryButton} w-full`}>
            {initiate.isPending ? (
              <>
                <RefreshCw size={16} className="animate-spin" aria-hidden /> Sending OTP…
              </>
            ) : (
              <>
                Continue <ChevronRight size={17} aria-hidden />
              </>
            )}
          </button>
        </form>
      )}
    </ModalShell>
  );
}
