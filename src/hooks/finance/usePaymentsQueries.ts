/**
 * Cached reads and writes for the school-admin payments area.
 *
 * Transaction totals and the transaction list are money, so they use
 * `staleTimes.live` and refetch on every mount. Recording a manual payment
 * settles through the same path as an online one — it credits the wallet and
 * issues a receipt — so it invalidates the finance caches as well as its own.
 *
 * Lives under `hooks/finance` because payments and the wallet are one area;
 * the permission is different though, `manage:payments` rather than
 * `manage:finance`.
 */
"use client";

import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import {
  createManualPayment,
  getAdminReceipts,
  getAdminSummary,
  getAdminTransactions,
  getEnabledProviders,
  type AdminReceiptQuery,
  type AdminSummary,
  type AdminTransactionQuery,
  type PaginatedResponse,
  type PaymentProvider,
  type PaymentTransaction,
  type ManualPaymentPayload,
  type Receipt,
} from "@/app/services/payments.service";
import { useInvalidateFinance } from "./useFinanceQueries";

/** Placeholder key segment used while the session has no school yet. */
const NO_SCHOOL = "none";

/** Rows per page for every list in the payments area. */
export const PAYMENTS_PAGE_SIZE = 20;

/**
 * Transaction totals for the school.
 *
 * @returns Query result; `data` is undefined until the first load finishes.
 */
export function usePaymentsSummary(): UseQueryResult<AdminSummary> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.payments.summary(schoolId ?? NO_SCHOOL),
    queryFn: getAdminSummary,
    enabled: Boolean(schoolId),
    staleTime: staleTimes.live,
  });
}

/**
 * A server-paged slice of the school's fee transactions.
 *
 * @param params - Status/provider filters and paging; each value is cached separately.
 * @returns Query result carrying the page and its pagination block.
 */
export function usePaymentTransactions(
  params: AdminTransactionQuery = {}
): UseQueryResult<PaginatedResponse<PaymentTransaction>> {
  const schoolId = useSchoolId();
  const keyParams: Record<string, unknown> = { ...params };
  return useQuery({
    queryKey: queryKeys.payments.transactions(schoolId ?? NO_SCHOOL, keyParams),
    queryFn: () => getAdminTransactions(params),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.live,
    placeholderData: (previous) => previous,
  });
}

/**
 * A server-paged slice of the school's receipts.
 *
 * @param params - Student/term filters and paging; each value is cached separately.
 * @returns Query result carrying the page and its pagination block.
 */
export function usePaymentReceipts(
  params: AdminReceiptQuery = {}
): UseQueryResult<PaginatedResponse<Receipt>> {
  const schoolId = useSchoolId();
  return useQuery({
    // Receipts share the transactions key space, tagged so the two lists never collide.
    queryKey: queryKeys.payments.transactions(schoolId ?? NO_SCHOOL, {
      receipts: true,
      ...params,
    }),
    queryFn: () => getAdminReceipts(params),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.live,
    placeholderData: (previous) => previous,
  });
}

/**
 * The payment providers enabled for checkout. Platform-level configuration
 * that changes rarely, so it is cached as reference data.
 *
 * @returns Query result; `data` is `[]` once loaded with none enabled.
 */
export function usePaymentProviders(): UseQueryResult<PaymentProvider[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.payments.providers(schoolId ?? NO_SCHOOL),
    queryFn: async () => (await getEnabledProviders()).providers ?? [],
    enabled: Boolean(schoolId),
    staleTime: staleTimes.reference,
  });
}

/**
 * Records a payment taken outside the platform.
 *
 * The backend credits the wallet and issues a receipt, so this drops the
 * payments caches *and* the finance ones — otherwise the wallet balance on the
 * finance page would still show the figure from before the payment.
 *
 * @returns Mutation resolving to the created transaction and receipt.
 */
export function useCreateManualPayment(): UseMutationResult<
  { transactionId: string; receiptNumber: string },
  Error,
  ManualPaymentPayload
> {
  const queryClient = useQueryClient();
  const invalidateFinance = useInvalidateFinance();
  const schoolId = useSchoolId() ?? NO_SCHOOL;
  // Transactions and receipts both hang off the transactions key; drop the
  // params segment so every filtered page is invalidated, not just page one.
  const listPrefix = queryKeys.payments.transactions(schoolId).slice(0, 3);

  return useMutation({
    mutationFn: async (payload: ManualPaymentPayload) => {
      const result = await createManualPayment(payload);
      return {
        transactionId: result.transaction?._id ?? "",
        receiptNumber: result.receipt?.receiptNumber ?? "",
      };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: listPrefix }),
        queryClient.invalidateQueries({ queryKey: queryKeys.payments.summary(schoolId) }),
        invalidateFinance.money(),
      ]);
    },
  });
}
