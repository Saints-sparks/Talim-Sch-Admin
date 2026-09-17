/**
 * Every finance write, each paired with the cache it has to drop.
 *
 * A balance must never survive a mutation: anything that moves money calls
 * `money()` from `useInvalidateFinance`, which invalidates the wallet, the
 * ledger and every page of the withdrawal list together. Bank-account and
 * two-factor writes drop their own list only.
 *
 * The three withdrawal steps are separate mutations on purpose — the flow is
 * draft → OTP → confirm, and each step has its own failure modes (a wrong
 * code, an expired draft, a missing authenticator code) that the step's own
 * screen handles.
 */
"use client";

import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import {
  addBankAccount,
  cancelWithdrawal,
  confirmWithdrawal,
  disable2fa,
  initiateWithdrawal,
  removeBankAccount,
  resendWithdrawalOtp,
  setDefaultBankAccount,
  setRequire2faForWithdrawals,
  setup2fa,
  verify2fa,
  verifyBankAccount,
  verifyWithdrawalOtp,
  type AddBankAccountPayload,
  type BankAccount,
  type ConfirmWithdrawalPayload,
  type ConfirmedWithdrawal,
  type WithdrawalSummary,
} from "@/app/services/finance.service";
import { useInvalidateFinance } from "./useFinanceQueries";

/** What `initiateWithdrawal` hands back to the OTP step. */
export interface WithdrawalDraft {
  withdrawalDraftId: string;
  maskedEmail: string;
  expiresIn: number;
}

/**
 * Adds a payout bank account.
 *
 * @returns Mutation whose success refreshes the payout-account list.
 */
export function useAddBankAccount(): UseMutationResult<BankAccount, Error, AddBankAccountPayload> {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: async (payload: AddBankAccountPayload) => (await addBankAccount(payload)).account,
    onSuccess: () => invalidate.bankAccounts(),
  });
}

/**
 * Verifies an account against the bank's records.
 *
 * @returns Mutation whose success refreshes the payout-account list.
 */
export function useVerifyBankAccount(): UseMutationResult<BankAccount, Error, string> {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: async (accountId: string) => (await verifyBankAccount(accountId)).account,
    onSuccess: () => invalidate.bankAccounts(),
  });
}

/**
 * Makes a verified account the default for new withdrawals.
 *
 * @returns Mutation whose success refreshes the payout-account list.
 */
export function useSetDefaultBankAccount(): UseMutationResult<BankAccount, Error, string> {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: async (accountId: string) => (await setDefaultBankAccount(accountId)).account,
    onSuccess: () => invalidate.bankAccounts(),
  });
}

/**
 * Removes a payout account.
 *
 * @returns Mutation whose success refreshes the payout-account list.
 */
export function useRemoveBankAccount(): UseMutationResult<{ success: boolean }, Error, string> {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (accountId: string) => removeBankAccount(accountId),
    onSuccess: () => invalidate.bankAccounts(),
  });
}

/**
 * Step 1 of the withdrawal flow: validate the amount and email a code.
 *
 * Nothing is debited yet, so no cache is invalidated here — the balance only
 * changes at confirm.
 *
 * @returns Mutation resolving to the draft the OTP step needs.
 */
export function useInitiateWithdrawal(): UseMutationResult<
  WithdrawalDraft,
  Error,
  { bankAccountId: string; amount: number; note?: string }
> {
  return useMutation({
    mutationFn: async (payload) => {
      const result = await initiateWithdrawal(payload);
      return {
        withdrawalDraftId: result.withdrawalDraftId,
        maskedEmail: result.maskedEmail,
        expiresIn: result.expiresIn,
      };
    },
  });
}

/**
 * Step 2a: resend the emailed code. The backend enforces the cooldown.
 *
 * @returns Mutation that resolves once the new code is on its way.
 */
export function useResendWithdrawalOtp(): UseMutationResult<{ maskedEmail: string }, Error, string> {
  return useMutation({
    mutationFn: async (withdrawalDraftId: string) => {
      const result = await resendWithdrawalOtp(withdrawalDraftId);
      return { maskedEmail: result.maskedEmail };
    },
  });
}

/**
 * Step 2b: verify the emailed code and get the confirmation figures.
 *
 * @returns Mutation resolving to the summary shown on the confirm step.
 */
export function useVerifyWithdrawalOtp(): UseMutationResult<
  WithdrawalSummary,
  Error,
  { withdrawalDraftId: string; otp: string }
> {
  return useMutation({
    mutationFn: async (payload) => (await verifyWithdrawalOtp(payload)).summary,
  });
}

/**
 * Step 3: create the withdrawal and hold the funds.
 *
 * This is the point the money moves, so it invalidates the balance, the ledger
 * and the withdrawal list before the success screen is shown.
 *
 * @returns Mutation resolving to the created withdrawal.
 */
export function useConfirmWithdrawal(): UseMutationResult<
  ConfirmedWithdrawal,
  Error,
  ConfirmWithdrawalPayload
> {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: async (payload: ConfirmWithdrawalPayload) =>
      (await confirmWithdrawal(payload)).withdrawal,
    onSuccess: () => invalidate.money(),
  });
}

/**
 * Cancels a pending withdrawal, which releases the hold back into the balance.
 *
 * @returns Mutation whose success refreshes balances, ledger and withdrawals.
 */
export function useCancelWithdrawal(): UseMutationResult<{ success: boolean }, Error, string> {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (withdrawalId: string) => cancelWithdrawal(withdrawalId),
    onSuccess: () => invalidate.money(),
  });
}

/**
 * Starts two-factor enrolment.
 *
 * @returns Mutation resolving to the otpauth URL and QR image.
 */
export function useSetup2fa(): UseMutationResult<{ otpauthUrl: string; qrCode: string }, Error, void> {
  return useMutation({ mutationFn: () => setup2fa() });
}

/**
 * Confirms an authenticator code and enables two-factor.
 *
 * @returns Mutation whose success refreshes the security status.
 */
export function useVerify2fa(): UseMutationResult<{ success: boolean }, Error, string> {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (token: string) => verify2fa(token),
    onSuccess: () => invalidate.security(),
  });
}

/**
 * Disables two-factor with a current code.
 *
 * @returns Mutation whose success refreshes the security status.
 */
export function useDisable2fa(): UseMutationResult<{ success: boolean }, Error, string> {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (token: string) => disable2fa(token),
    onSuccess: () => invalidate.security(),
  });
}

/**
 * Turns "Require 2FA for withdrawals" on or off. Turning it off needs a
 * current authenticator code, which the server insists on.
 *
 * @returns Mutation whose success refreshes the security status.
 */
export function useSetRequire2fa(): UseMutationResult<
  { success: boolean },
  Error,
  { require: boolean; token?: string }
> {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: ({ require, token }: { require: boolean; token?: string }) =>
      setRequire2faForWithdrawals(require, token),
    onSuccess: () => invalidate.security(),
  });
}
