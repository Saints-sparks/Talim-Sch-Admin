/**
 * Settings → Payments & Finance data: the wallet summary, the payout bank
 * accounts and the withdrawal safeguards.
 *
 * Wallet and bank accounts are keyed under `queryKeys.finance`, the same keys
 * the Finance page uses, so adding an account here shows up there too.
 */
"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/components/CustomToast";
import { useSchoolId } from "@/hooks/useSchoolId";
import { settingsKeys } from "@/hooks/settings/keys";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import {
  addBankAccount,
  getBankAccounts,
  getBanks,
  getWalletSummary,
  resolveBankAccount,
  setDefaultBankAccount,
  type AddBankAccountPayload,
  type BankAccount,
  type PaystackBank,
  type WalletSummary,
} from "@/app/services/finance.service";
import {
  getFinanceSettings,
  updateFinanceSettings,
  type FinanceSettings,
  type UpdateFinanceSettingsDto,
} from "@/app/services/school-settings.service";

/**
 * The school wallet summary.
 *
 * @returns Query result. Money is never served stale.
 */
export function useWalletSummary(): UseQueryResult<WalletSummary> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.finance.wallet(schoolId ?? "none"),
    queryFn: async () => (await getWalletSummary()).summary,
    enabled: Boolean(schoolId),
    staleTime: staleTimes.live,
  });
}

/**
 * The school's payout bank accounts.
 *
 * @returns Query result; `data` is undefined until the first load finishes.
 */
export function useBankAccounts(): UseQueryResult<BankAccount[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.finance.bankAccounts(schoolId ?? "none"),
    queryFn: async () => (await getBankAccounts()).accounts ?? [],
    enabled: Boolean(schoolId),
    staleTime: staleTimes.list,
  });
}

/**
 * The school's withdrawal safeguards.
 *
 * @returns Query result; `data` is undefined until the first load finishes.
 */
export function useFinanceSettings(): UseQueryResult<FinanceSettings> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: settingsKeys.finance(schoolId ?? "none"),
    queryFn: async () => (await getFinanceSettings()).settings,
    enabled: Boolean(schoolId),
    staleTime: staleTimes.reference,
  });
}

/** What {@link useUpdateFinanceSettings} returns. */
export interface UpdateFinanceSettings {
  /**
   * Saves the given fields.
   *
   * @param dto - The fields to change.
   * @param successMessage - Toast to show; omit for a silent save.
   */
  save: (dto: UpdateFinanceSettingsDto, successMessage?: string) => Promise<FinanceSettings>;
  /** True while a save is in flight. */
  saving: boolean;
}

/**
 * Saves the withdrawal safeguards, optimistically so a toggle flips at once,
 * rolling back and reporting if the request fails.
 *
 * @returns The save function and its pending flag.
 */
export function useUpdateFinanceSettings(): UpdateFinanceSettings {
  const client = useQueryClient();
  const schoolId = useSchoolId();
  const key = settingsKeys.finance(schoolId ?? "none");

  const mutation = useMutation({
    mutationFn: async ({ dto }: { dto: UpdateFinanceSettingsDto; successMessage?: string }) =>
      (await updateFinanceSettings(dto)).settings,
    onMutate: async ({ dto }) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<FinanceSettings>(key);
      if (previous) client.setQueryData<FinanceSettings>(key, { ...previous, ...dto });
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
      logger.error("settings/finance", "save failed", err);
      toast.error(getErrorMessage(err, "Failed to save withdrawal settings"));
    },
    onSuccess: (settings, { successMessage }) => {
      client.setQueryData(key, settings);
      if (successMessage) toast.success(successMessage);
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: key });
    },
  });

  return {
    save: (dto, successMessage) => mutation.mutateAsync({ dto, successMessage }),
    saving: mutation.isPending,
  };
}

/** What {@link useBankAccountActions} returns. */
export interface BankAccountActions {
  /** Adds a payout account. */
  add: (payload: AddBankAccountPayload) => Promise<BankAccount>;
  /** True while the add is in flight. */
  adding: boolean;
  /** Makes one account the default for withdrawals. */
  makeDefault: (accountId: string) => Promise<BankAccount>;
}

/**
 * Adding a payout account and choosing the default one.
 *
 * Both invalidate the bank-account list — the Finance page reads the same key,
 * so it never shows a stale default.
 *
 * @returns The two actions and the add pending flag.
 */
export function useBankAccountActions(): BankAccountActions {
  const client = useQueryClient();
  const schoolId = useSchoolId();
  const key = queryKeys.finance.bankAccounts(schoolId ?? "none");
  const invalidate = () => client.invalidateQueries({ queryKey: key });

  const addMutation = useMutation({
    mutationFn: async (payload: AddBankAccountPayload) => (await addBankAccount(payload)).account,
    onSuccess: () => {
      invalidate();
      toast.success("Bank account added");
    },
    onError: (err) => {
      logger.error("settings/bank-accounts", "add failed", err);
      toast.error(getErrorMessage(err, "Failed to add account"));
    },
  });

  const defaultMutation = useMutation({
    mutationFn: async (accountId: string) => (await setDefaultBankAccount(accountId)).account,
    onSuccess: () => {
      invalidate();
      // The default payout account is part of the finance settings view too.
      client.invalidateQueries({ queryKey: settingsKeys.finance(schoolId ?? "none") });
      toast.success("Default account updated");
    },
    onError: (err) => {
      logger.error("settings/bank-accounts", "set default failed", err);
      toast.error(getErrorMessage(err, "Failed to update the default account"));
    },
  });

  return {
    add: addMutation.mutateAsync,
    adding: addMutation.isPending,
    makeDefault: defaultMutation.mutateAsync,
  };
}

/**
 * The bank list for a country, cached per country so switching back and forth
 * costs nothing.
 *
 * @param country - Country slug, e.g. "nigeria"; the list only exists for
 *   Paystack-supported countries.
 * @param enabled - False for countries entered by hand.
 * @returns Query result; `data` is `[]` until it loads.
 */
export function useBanks(country: string, enabled: boolean): UseQueryResult<PaystackBank[]> {
  return useQuery({
    queryKey: settingsKeys.banks(country),
    queryFn: async () => (await getBanks(country)).banks ?? [],
    enabled,
    staleTime: staleTimes.reference,
  });
}

/**
 * The name the bank holds for an account number — the check that stops a
 * payout going to a mistyped account.
 *
 * The query only runs once the number is complete, and its result is cached by
 * bank and number, so correcting a typo and going back costs no extra call.
 *
 * @param accountNumber - The typed account number.
 * @param bankCode - The selected bank's code, or null.
 * @returns Query result carrying the resolved account name.
 */
export function useResolvedAccountName(
  accountNumber: string,
  bankCode: string | null
): UseQueryResult<string> {
  return useQuery({
    queryKey: settingsKeys.bankAccountName(bankCode ?? "none", accountNumber),
    queryFn: async () => (await resolveBankAccount(accountNumber, bankCode as string)).accountName,
    enabled: Boolean(bankCode) && accountNumber.length === 10,
    retry: false,
    staleTime: staleTimes.reference,
  });
}
