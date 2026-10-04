/**
 * Cached reads and writes for bank-transfer reconciliation (C4).
 *
 * Parents report a transfer to the school's account; it stays pending until
 * the bursary confirms the money arrived (the ledger and a receipt are
 * written) or rejects it with a reason. The routes need `manage:fees`, not
 * `manage:payments`: reconciling is fee work.
 *
 * Lists are money, so they use `staleTimes.live`. A decision invalidates every
 * bank-transfer page (all three statuses move), the payments lists and totals,
 * and the fees caches (ledger balances and the fees dashboard change).
 */
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";
import {
  confirmBankTransfer,
  getBankTransfers,
  rejectBankTransfer,
  type BankTransferDecision,
  type BankTransferPage,
  type BankTransferQuery,
} from "@/app/services/payments.service";

/** Placeholder key segment used while the session has no school yet. */
const NO_SCHOOL = "none";

/** Rows per page on the reconciliation screen. */
export const BANK_TRANSFERS_PAGE_SIZE = 20;

/**
 * Whether the signed-in admin may see and decide bank transfers: the school
 * admin, or a sub-admin with `manage:fees` (the routes' permission).
 *
 * @returns True when the reconciliation screen should be offered.
 */
export function useCanReconcileBankTransfers(): boolean {
  return usePermissions().hasPermission(Permission.MANAGE_FEES);
}

/**
 * One page of the school's bank transfers in one status.
 *
 * @param params - Status (default `pending`) and paging; each value is cached separately.
 * @param options - `enabled: false` keeps the query idle (e.g. without the permission).
 * @param options.enabled - False to keep the query idle.
 * @returns Query result carrying `{ data, total, page, limit }`.
 */
export function useBankTransfers(
  params: BankTransferQuery = {},
  options: { enabled?: boolean } = {}
): UseQueryResult<BankTransferPage> {
  const schoolId = useSchoolId();
  const canReconcile = useCanReconcileBankTransfers();
  const query: BankTransferQuery = { status: "pending", ...params };
  return useQuery({
    queryKey: queryKeys.payments.bankTransfers(schoolId ?? NO_SCHOOL, { ...query }),
    queryFn: () => getBankTransfers(query),
    enabled: Boolean(schoolId) && canReconcile && options.enabled !== false,
    staleTime: staleTimes.live,
    placeholderData: (previous) => previous,
  });
}

/**
 * How many transfers are waiting for the bursary, for a badge on the entry
 * points. One request (`limit=1`, read `total`), never a list walk.
 *
 * @returns The pending count, or `undefined` until it loads (or without the permission).
 */
export function usePendingBankTransferCount(): number | undefined {
  const query = useBankTransfers({ status: "pending", page: 1, limit: 1 });
  return query.data?.total;
}

/**
 * Drops every cache a bank-transfer decision changes.
 *
 * @returns A function that invalidates them and resolves once they are marked stale.
 */
function useInvalidateAfterDecision(): () => Promise<void> {
  const client = useQueryClient();
  const schoolId = useSchoolId() ?? NO_SCHOOL;
  return async () => {
    await Promise.all([
      // Every status and page: a decision moves a row from one list to another.
      client.invalidateQueries({
        queryKey: queryKeys.payments.bankTransfers(schoolId).slice(0, 3),
      }),
      client.invalidateQueries({
        queryKey: queryKeys.payments.transactions(schoolId).slice(0, 3),
      }),
      client.invalidateQueries({ queryKey: queryKeys.payments.summary(schoolId) }),
      // Ledger balances and the fees dashboard totals.
      client.invalidateQueries({ queryKey: queryKeys.fees.all }),
    ]);
  };
}

/**
 * Confirms a transfer: the ledger and a receipt are written and the parent is
 * told. The platform wallet is not credited.
 *
 * @returns Mutation taking the transfer id, resolving to the decision (with the receipt).
 */
export function useConfirmBankTransfer(): UseMutationResult<BankTransferDecision, Error, string> {
  const invalidate = useInvalidateAfterDecision();
  return useMutation({
    mutationFn: (transactionId: string) => confirmBankTransfer(transactionId),
    onSettled: invalidate,
  });
}

/** What {@link useRejectBankTransfer} takes. */
export interface RejectBankTransferInput {
  /** The transfer's id. */
  transactionId: string;
  /** Shown to the parent; must not be blank. */
  reason: string;
}

/**
 * Rejects a transfer with a reason; its fees are released and the parent is
 * told.
 *
 * @returns Mutation taking `{ transactionId, reason }`.
 */
export function useRejectBankTransfer(): UseMutationResult<
  BankTransferDecision,
  Error,
  RejectBankTransferInput
> {
  const invalidate = useInvalidateAfterDecision();
  return useMutation({
    mutationFn: ({ transactionId, reason }: RejectBankTransferInput) =>
      rejectBankTransfer(transactionId, { reason: reason.trim() }),
    onSettled: invalidate,
  });
}
