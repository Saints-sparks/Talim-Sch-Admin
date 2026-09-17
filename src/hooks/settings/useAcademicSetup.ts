/**
 * Settings → Academic Setup data.
 *
 * Years and terms are shared reference data, so they come from the app-wide
 * reference hooks (one cached copy for every page that needs a year or term
 * dropdown) and every mutation here invalidates that same cache.
 */
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/CustomToast";
import { useAcademicYears, useTerms } from "@/hooks/queries/reference";
import { queryKeys } from "@/lib/queryKeys";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import {
  createAcademicYear,
  createTerm,
  setCurrentTerm,
  type AcademicYear,
  type AcademicYearResponse,
  type Term,
  type TermResponse,
} from "@/app/services/academic.service";

/** How far through the academic year the school is. */
export interface AcademicProgress {
  /** Percentage of the year elapsed, 0–100. */
  pct: number;
  daysElapsed: number;
  daysRemaining: number;
  /** Length of the year in days. */
  total: number;
}

/** Everything Settings → Academic Setup renders. */
export interface AcademicSetup {
  years: AcademicYearResponse[];
  terms: TermResponse[];
  currentYear?: AcademicYearResponse;
  currentTerm?: TermResponse;
  progress: AcademicProgress | null;
  /** True until both lists have loaded for the first time. */
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  /** Refetches both lists. */
  refetch: () => void;
}

/**
 * Computes how far through the academic year the school is.
 *
 * @param year - The current academic year, if one is set.
 * @param now - Reference time, for tests.
 * @returns The progress, or `null` when there is no current year.
 */
export function academicProgress(
  year: AcademicYearResponse | undefined,
  now: number = Date.now()
): AcademicProgress | null {
  if (!year?.startDate || !year?.endDate) return null;
  const start = new Date(year.startDate).getTime();
  const end = new Date(year.endDate).getTime();
  const total = end - start;
  if (!Number.isFinite(total) || total <= 0) return null;
  const elapsed = Math.max(0, Math.min(now - start, total));
  return {
    pct: Math.round((elapsed / total) * 100),
    daysElapsed: Math.round(elapsed / 86_400_000),
    daysRemaining: Math.max(0, Math.round((end - now) / 86_400_000)),
    total: Math.round(total / 86_400_000),
  };
}

/**
 * The academic years and terms behind Settings → Academic Setup.
 *
 * Both lists load in parallel off the shared reference cache.
 *
 * @returns The lists, the current year and term, year progress and load state.
 */
export function useAcademicSetup(): AcademicSetup {
  const years = useAcademicYears();
  const terms = useTerms();

  const yearList = years.data ?? [];
  const termList = terms.data ?? [];
  const currentYear = yearList.find((y) => y.isCurrent);

  return {
    years: yearList,
    terms: termList,
    currentYear,
    currentTerm: termList.find((t) => t.isCurrent),
    progress: academicProgress(currentYear),
    isLoading: years.isLoading || terms.isLoading,
    isError: years.isError || terms.isError,
    error: years.error ?? terms.error,
    refetch: () => {
      years.refetch();
      terms.refetch();
    },
  };
}

/** The mutations Settings → Academic Setup can run. */
export interface AcademicSetupActions {
  /** Creates an academic year. */
  addYear: (year: AcademicYear) => Promise<AcademicYearResponse>;
  /** Creates a term inside an academic year. */
  addTerm: (term: Omit<Term, "schoolId">) => Promise<TermResponse>;
  /** Makes one term the current one. */
  makeTermCurrent: (termId: string) => Promise<void>;
  /** True while any of them is in flight. */
  submitting: boolean;
}

/**
 * Creating years and terms, and switching the current term.
 *
 * Each success invalidates the shared academic cache, so every page showing a
 * year or term picker sees the change without a reload.
 *
 * @returns The three actions and a shared pending flag.
 */
export function useAcademicSetupActions(): AcademicSetupActions {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: queryKeys.academic.all });

  const fail = (scope: string, fallback: string) => (err: unknown) => {
    logger.error(`settings/${scope}`, fallback, err);
    toast.error(getErrorMessage(err, fallback));
  };

  const yearMutation = useMutation({
    mutationFn: (year: AcademicYear) => createAcademicYear(year),
    onSuccess: () => {
      invalidate();
      toast.success("Academic year created");
    },
    onError: fail("academic-year", "Failed to create academic year"),
  });

  const termMutation = useMutation({
    mutationFn: (term: Omit<Term, "schoolId">) => createTerm(term),
    onSuccess: () => {
      invalidate();
      toast.success("Term created");
    },
    onError: fail("term", "Failed to create term"),
  });

  const currentTermMutation = useMutation({
    mutationFn: (termId: string) => setCurrentTerm(termId),
    onSuccess: () => {
      invalidate();
      toast.success("Current term updated");
    },
    onError: fail("current-term", "Failed to update current term"),
  });

  return {
    addYear: yearMutation.mutateAsync,
    addTerm: termMutation.mutateAsync,
    makeTermCurrent: currentTermMutation.mutateAsync,
    submitting:
      yearMutation.isPending || termMutation.isPending || currentTermMutation.isPending,
  };
}
