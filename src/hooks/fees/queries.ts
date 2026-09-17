/**
 * Cached reads for the Fees area.
 *
 * Stale times follow how the data actually behaves:
 * - categories and receipt settings change a few times a term → `reference`
 * - fee items and assignments are edited by admins during the day → `list`
 * - the dashboard summary is money, so it refetches on every mount → `live`
 *
 * Keys are built from `queryKeys.fees`, so every fees query carries the school
 * id and a school switch drops the lot. Mutations must invalidate through
 * `useInvalidateFees()` rather than refetching by hand.
 */
"use client";

import { keepPreviousData, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import {
  getCategoriesSummary,
  getFeeAssignments,
  getFeeCategories,
  getFeeItemById,
  getFeeItems,
  getFeesDashboardSummary,
  getReceiptSettings,
  type DashboardSummary,
  type FeeAssignment,
  type FeeAssignmentQuery,
  type FeeCategory,
  type FeeItem,
  type FeeItemQuery,
  type FeePage,
  type ReceiptSettings,
} from "@/app/services/fees.service";

/** School id placeholder used while the session is still loading. */
const NO_SCHOOL = "none";

/** Per-call switches shared by the list hooks. */
export interface FeesQueryOptions {
  /** Set false to keep a list from loading until its tab is open. */
  enabled?: boolean;
}

/**
 * Totals across fee items, assignments and payments. Money, so it is never
 * served stale: every mount refetches.
 *
 * @returns Query result; `data` is undefined until the first load finishes.
 */
export function useFeesSummary(): UseQueryResult<DashboardSummary> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.fees.summary(schoolId ?? NO_SCHOOL),
    queryFn: getFeesDashboardSummary,
    enabled: Boolean(schoolId),
    staleTime: staleTimes.live,
  });
}

/**
 * The school's fee categories.
 *
 * @param includeArchived - Include archived categories, needed by the
 *   Categories and Archived tabs. Defaults to `false`.
 * @returns Query result; `data` is the full list.
 */
export function useFeeCategories(includeArchived = false): UseQueryResult<FeeCategory[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: [...queryKeys.fees.categories(schoolId ?? NO_SCHOOL), { includeArchived }],
    queryFn: () => getFeeCategories(includeArchived),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.reference,
  });
}

/**
 * Categories with the number of fee items in each, for the sidebar summary.
 *
 * @returns Query result; each category carries `feeCount`.
 */
export function useFeeCategoriesSummary(): UseQueryResult<FeeCategory[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: [...queryKeys.fees.categories(schoolId ?? NO_SCHOOL), "summary"],
    queryFn: getCategoriesSummary,
    enabled: Boolean(schoolId),
    staleTime: staleTimes.reference,
  });
}

/**
 * One server-side page of fee items. The previous page stays on screen while
 * the next one loads, so the table does not collapse between pages.
 *
 * @param params - Paging, search and filters, passed straight to the API.
 * @param options - Set `enabled: false` while the list is not on screen.
 * @returns Query result carrying `{ data, total }`.
 */
export function useFeeItems(
  params: FeeItemQuery = {},
  options: FeesQueryOptions = {}
): UseQueryResult<FeePage<FeeItem>> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: [...queryKeys.fees.items(schoolId ?? NO_SCHOOL), params],
    queryFn: () => getFeeItems(params),
    enabled: Boolean(schoolId) && options.enabled !== false,
    staleTime: staleTimes.list,
    placeholderData: keepPreviousData,
  });
}

/**
 * One fee item, for the edit form.
 *
 * @param id - Fee item id, or `null` when creating rather than editing.
 * @returns Query result; disabled (and never loading) when `id` is null.
 */
export function useFeeItem(id: string | null): UseQueryResult<FeeItem> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: [...queryKeys.fees.items(schoolId ?? NO_SCHOOL), "detail", id],
    queryFn: () => getFeeItemById(id as string),
    enabled: Boolean(schoolId) && Boolean(id),
    staleTime: staleTimes.list,
  });
}

/**
 * One server-side page of class assignments.
 *
 * @param params - Paging and filters, passed straight to the API.
 * @param options - Set `enabled: false` while the list is not on screen.
 * @returns Query result carrying `{ data, total }`.
 */
export function useFeeAssignments(
  params: FeeAssignmentQuery = {},
  options: FeesQueryOptions = {}
): UseQueryResult<FeePage<FeeAssignment>> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.fees.assignments(schoolId ?? NO_SCHOOL, { ...params }),
    queryFn: () => getFeeAssignments(params),
    enabled: Boolean(schoolId) && options.enabled !== false,
    staleTime: staleTimes.list,
    placeholderData: keepPreviousData,
  });
}

/**
 * Receipt signature settings.
 *
 * @returns Query result; the API returns defaults rather than 404 when the
 *   school has never saved any.
 */
export function useReceiptSettings(): UseQueryResult<ReceiptSettings> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: [...queryKeys.fees.all, schoolId ?? NO_SCHOOL, "receiptSettings"],
    queryFn: getReceiptSettings,
    enabled: Boolean(schoolId),
    staleTime: staleTimes.reference,
  });
}

/** What every fees mutation calls to refresh the lists it changed. */
export interface FeesInvalidators {
  /** Every fees query, for changes that ripple (rarely needed). */
  all: () => Promise<void>;
  /** After creating, editing, archiving or restoring a fee item. */
  items: () => Promise<void>;
  /** After creating, editing, archiving or restoring a category. */
  categories: () => Promise<void>;
  /** After assigning, publishing, archiving or restoring an assignment. */
  assignments: () => Promise<void>;
  /** The dashboard totals alone. */
  summary: () => Promise<void>;
  /** After saving or clearing the receipt signature. */
  receiptSettings: () => Promise<void>;
}

/**
 * Invalidators for the fees caches. Anything that changes money also refreshes
 * the dashboard summary, so a new fee never leaves a stale total on screen.
 *
 * @returns One invalidate function per fees resource.
 */
export function useInvalidateFees(): FeesInvalidators {
  const client = useQueryClient();
  const schoolId = useSchoolId() ?? NO_SCHOOL;
  const invalidate = async (queryKey: readonly unknown[]) => {
    await client.invalidateQueries({ queryKey });
  };
  const summary = () => invalidate(queryKeys.fees.summary(schoolId));

  return {
    all: () => invalidate(queryKeys.fees.all),
    items: async () => {
      await Promise.all([invalidate(queryKeys.fees.items(schoolId)), summary()]);
    },
    categories: async () => {
      await Promise.all([invalidate(queryKeys.fees.categories(schoolId)), summary()]);
    },
    assignments: async () => {
      await Promise.all([invalidate(queryKeys.fees.assignments(schoolId)), summary()]);
    },
    summary,
    receiptSettings: () => invalidate([...queryKeys.fees.all, schoolId, "receiptSettings"]),
  };
}
