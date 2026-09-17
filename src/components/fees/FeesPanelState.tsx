"use client";

import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { SectionSkeleton } from "@/components/ui/loading";
import { feesErrorMessage, isRetryableFeesError } from "./errors";
import { mutedTextClass, secondaryButtonClass } from "./ui";

/** Status of the panel's own query, in the order the panel checks them. */
interface FeesPanelStateProps {
  /** True while the first load is in flight. */
  loading: boolean;
  /** What the query threw, if it failed. */
  error: unknown;
  /** True once loaded with nothing to show. */
  empty: boolean;
  /** What is being loaded, for the error message, e.g. "fee items". */
  subject: string;
  /** Message shown when there is nothing yet. */
  emptyMessage: string;
  /** Re-runs the failed query. */
  onRetry: () => void;
  /** Skeleton rows while loading. */
  rows?: number;
}

/**
 * Loading, error and empty states for one fees panel.
 *
 * Returns `null` when there is data to show, so a panel renders
 * `<FeesPanelState … /> ?? <table>` style: no failed request leaves a
 * spinner turning, and every error says what happened and offers a retry.
 *
 * @param props - Query status and the copy for this panel.
 * @returns The state block, or null when the panel should render its content.
 */
export function FeesPanelState({
  loading,
  error,
  empty,
  subject,
  emptyMessage,
  onRetry,
  rows = 5,
}: FeesPanelStateProps) {
  if (loading) {
    return (
      <div className="p-4">
        <SectionSkeleton rows={rows} rowClassName="h-10" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 px-4 flex flex-col items-center text-center gap-3">
        <FiAlertCircle className="text-red-500" size={22} />
        <p className="text-sm text-gray-700 dark:text-gray-300 max-w-sm">
          {feesErrorMessage(error, subject)}
        </p>
        {isRetryableFeesError(error) && (
          <button
            type="button"
            onClick={onRetry}
            className={`flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 ${secondaryButtonClass}`}
          >
            <FiRefreshCw size={12} /> Try again
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    return <div className={`py-12 text-center text-sm ${mutedTextClass}`}>{emptyMessage}</div>;
  }

  return null;
}
