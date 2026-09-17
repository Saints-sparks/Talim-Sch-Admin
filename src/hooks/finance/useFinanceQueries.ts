/**
 * Cached reads of the school's money.
 *
 * Balances, the ledger and withdrawal status are live data: they are keyed
 * with `staleTimes.live`, so every mount refetches and nothing shows a balance
 * that a mutation has already moved. Mutations live in `useFinanceMutations`
 * and invalidate through `useInvalidateFinance` — never cache a balance past a
 * mutation.
 *
 * Keys carry the school id (`queryKeys.finance.*`), so signing into another
 * school can never reuse this school's wallet.
 */
"use client";

import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import {
  getBankAccounts,
  getSecurityStatus,
  getWalletSummary,
  getWalletTransactions,
  getWithdrawals,
  type BankAccount,
  type LedgerEntry,
  type PaginatedResponse,
  type SecurityStatus,
  type WalletSummary,
  type WalletTransactionQuery,
  type WithdrawalQuery,
  type WithdrawalRequest,
} from "@/app/services/finance.service";

/** Placeholder key segment used while the session has no school yet. */
const NO_SCHOOL = "none";

/**
 * The school's wallet balances.
 *
 * @returns Query result; `data` is undefined until the first load finishes.
 */
export function useWalletSummary(): UseQueryResult<WalletSummary> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.finance.wallet(schoolId ?? NO_SCHOOL),
    queryFn: async () => (await getWalletSummary()).summary,
    enabled: Boolean(schoolId),
    staleTime: staleTimes.live,
  });
}

/**
 * A server-paged slice of the wallet ledger.
 *
 * @param params - Type filter and paging; each distinct value is cached separately.
 * @returns Query result carrying the page and its pagination block.
 */
export function useWalletTransactions(
  params: WalletTransactionQuery = {}
): UseQueryResult<PaginatedResponse<LedgerEntry>> {
  const schoolId = useSchoolId();
  const keyParams: Record<string, unknown> = { ...params };
  return useQuery({
    queryKey: queryKeys.finance.ledger(schoolId ?? NO_SCHOOL, keyParams),
    queryFn: () => getWalletTransactions(params),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.live,
    placeholderData: (previous) => previous,
  });
}

/**
 * The school's payout bank accounts, removed ones filtered out.
 *
 * @returns Query result; `data` is undefined until the first load finishes.
 */
export function useBankAccounts(): UseQueryResult<BankAccount[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.finance.bankAccounts(schoolId ?? NO_SCHOOL),
    queryFn: async () => {
      const { accounts } = await getBankAccounts();
      return (accounts ?? []).filter((account) => account.status !== "removed");
    },
    enabled: Boolean(schoolId),
    staleTime: staleTimes.live,
  });
}

/**
 * A server-paged slice of the school's withdrawals.
 *
 * @param params - Status filter and paging; each distinct value is cached separately.
 * @returns Query result carrying the page and its pagination block.
 */
export function useWithdrawals(
  params: WithdrawalQuery = {}
): UseQueryResult<PaginatedResponse<WithdrawalRequest>> {
  const schoolId = useSchoolId();
  const keyParams: Record<string, unknown> = { ...params };
  return useQuery({
    queryKey: queryKeys.finance.withdrawals(schoolId ?? NO_SCHOOL, keyParams),
    queryFn: () => getWithdrawals(params),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.live,
    placeholderData: (previous) => previous,
  });
}

/**
 * The signed-in admin's two-factor state. Read on the settings tab and again
 * on the withdrawal confirm step, which is why it is cached rather than
 * fetched twice.
 *
 * @returns Query result; `data` is undefined until the first load finishes.
 */
export function useSecurityStatus(): UseQueryResult<SecurityStatus> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.finance.security(schoolId ?? NO_SCHOOL),
    queryFn: getSecurityStatus,
    enabled: Boolean(schoolId),
    staleTime: staleTimes.live,
  });
}

/** The invalidators a finance mutation should call once it succeeds. */
export interface FinanceInvalidators {
  /** Balances, the ledger and the withdrawal list — everything a money movement touches. */
  money: () => Promise<void>;
  /** The payout-account list. */
  bankAccounts: () => Promise<void>;
  /** The caller's two-factor state. */
  security: () => Promise<void>;
  /** Every finance query at once. */
  all: () => Promise<void>;
}

/**
 * Invalidators for the finance caches.
 *
 * A withdrawal moves the balance, adds a ledger entry and changes the
 * withdrawal list at once, so `money()` drops all three together rather than
 * leaving a stale balance on screen beside a fresh withdrawal.
 *
 * @returns Functions that mark the matching finance queries stale.
 */
export function useInvalidateFinance(): FinanceInvalidators {
  const queryClient = useQueryClient();
  const schoolId = useSchoolId() ?? NO_SCHOOL;

  // The ledger and withdrawal keys end in a params object, so invalidating one
  // built with `{}` would only match the unfiltered page. Drop that last
  // segment and every filtered page of the same list is invalidated too.
  const ledgerPrefix = queryKeys.finance.ledger(schoolId).slice(0, 3);
  const withdrawalsPrefix = queryKeys.finance.withdrawals(schoolId).slice(0, 3);

  return {
    money: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.finance.wallet(schoolId) }),
        queryClient.invalidateQueries({ queryKey: ledgerPrefix }),
        queryClient.invalidateQueries({ queryKey: withdrawalsPrefix }),
      ]);
    },
    bankAccounts: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.finance.bankAccounts(schoolId) });
    },
    security: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.finance.security(schoolId) });
    },
    all: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.finance.all });
    },
  };
}
