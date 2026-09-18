"use client";

/**
 * The search box and filter panel above the assessment list.
 *
 * Filtering is client-side over the page the API returned, which is why the
 * panel says so when a filter hides everything on the current page.
 */
import React from "react";
import { FiFilter, FiSearch } from "react-icons/fi";
import TermSelector from "@/components/assessment/TermSelector";
import { ASSESSMENT_STATUSES } from "@/app/services/assessment.service";
import type { AssessmentStatus, Term } from "@/components/assessment/AssessmentForm.types";

/** What the list is narrowed by. */
export interface AssessmentFilterState {
  search: string;
  termId: string;
  status: AssessmentStatus | "";
}

/** No filters applied. */
export const EMPTY_FILTERS: AssessmentFilterState = { search: "", termId: "", status: "" };

/**
 * True when any filter is set.
 *
 * @param filters - The current filter state.
 * @returns Whether the list is narrowed.
 */
export function hasActiveFilters(filters: AssessmentFilterState): boolean {
  return Boolean(filters.search || filters.termId || filters.status);
}

/**
 * Narrows a page of assessments by the current filters.
 *
 * @param assessments - The page as the API returned it.
 * @param filters - The current filter state.
 * @returns The assessments to render.
 */
export function filterAssessments<
  T extends { name: string; description?: string; status: AssessmentStatus; termId: { _id: string } },
>(assessments: T[], filters: AssessmentFilterState): T[] {
  const search = filters.search.trim().toLowerCase();
  return assessments.filter((assessment) => {
    const matchesSearch =
      !search ||
      assessment.name.toLowerCase().includes(search) ||
      (assessment.description ?? "").toLowerCase().includes(search);
    const matchesTerm = !filters.termId || assessment.termId._id === filters.termId;
    const matchesStatus = !filters.status || assessment.status === filters.status;
    return matchesSearch && matchesTerm && matchesStatus;
  });
}

interface AssessmentFiltersProps {
  filters: AssessmentFilterState;
  onChange: (filters: AssessmentFilterState) => void;
  terms: Term[];
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * Renders the search box and the collapsible filter panel.
 *
 * @param props - See {@link AssessmentFiltersProps}.
 * @returns The panel.
 */
export function AssessmentFilters({
  filters,
  onChange,
  terms,
  isOpen,
  onToggle,
}: AssessmentFiltersProps) {
  const set = <K extends keyof AssessmentFilterState>(key: K, value: AssessmentFilterState[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative group">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => set("search", event.target.value)}
              aria-label="Search assessments"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-500"
              placeholder="Search assessments by name or description..."
            />
          </div>
        </div>

        <button
          onClick={onToggle}
          aria-expanded={isOpen}
          className="inline-flex items-center bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300"
        >
          <FiFilter className="h-4 w-4 mr-2" />
          Filters
        </button>
      </div>

      {isOpen && (
        <div className="mt-6 p-6 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Filter by Term
              </label>
              <div className="border border-gray-300 dark:border-slate-700 rounded-lg">
                <TermSelector
                  terms={terms}
                  selectedTermId={filters.termId}
                  onTermSelect={(termId) => set("termId", termId)}
                  placeholder="All terms"
                  allowEmpty
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2"
                htmlFor="assessment-status-filter"
              >
                Filter by Status
              </label>
              <select
                id="assessment-status-filter"
                value={filters.status}
                onChange={(event) => set("status", event.target.value as AssessmentStatus | "")}
                className="w-full px-3 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
              >
                <option value="">All statuses</option>
                {ASSESSMENT_STATUSES.map((status) => (
                  <option key={status} value={status} className="capitalize">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => onChange(EMPTY_FILTERS)}
                disabled={!hasActiveFilters(filters)}
                className="w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
