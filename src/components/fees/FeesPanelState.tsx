"use client";

import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { EmptyNote, rowButton, skeletonBlock } from "@/components/tl";
import { feesErrorMessage, isRetryableFeesError } from "./errors";

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
 * Loading, error and empty states for one fees panel, drawn inside the
 * panel's card.
 *
 * Returns `null` when there is data to show, so a panel renders
 * `<FeesPanelState … /> ?? <table>` style: no failed request leaves a
 * spinner turning, and every error says what happened and offers a retry.
 *
 * @param props - Query status and the copy for this panel.
 * @param props.loading - Whether the first load is in flight.
 * @param props.error - What the query threw.
 * @param props.empty - Whether it loaded with nothing to show.
 * @param props.subject - What is loading, for the error message.
 * @param props.emptyMessage - The empty-state sentence.
 * @param props.onRetry - Re-runs the query.
 * @param props.rows - Skeleton rows while loading.
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
      <div role="status" aria-busy="true" className="flex flex-col gap-2.5 p-5">
        <span className="sr-only">Loading {subject}</span>
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} aria-hidden className={`${skeletonBlock} h-10 rounded-xl`} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 px-4 py-10 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-tl-danger-bg text-tl-danger">
          <FiAlertCircle size={20} aria-hidden />
        </span>
        <p className="max-w-sm text-sm text-tl-body">{feesErrorMessage(error, subject)}</p>
        {isRetryableFeesError(error) && (
          <button type="button" onClick={onRetry} className={rowButton}>
            <FiRefreshCw size={13} aria-hidden /> Try again
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    return <EmptyNote compact title={emptyMessage} />;
  }

  return null;
}
