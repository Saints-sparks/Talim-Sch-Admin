"use client";

import { Clock } from "lucide-react";
import { focusRing } from "@/components/tl";

/** Retry and Delete: text buttons, 44px tall to touch. */
const actionClass = `inline-flex min-h-[44px] items-center rounded-md px-1 font-bold underline-offset-2 hover:underline ${focusRing}`;

/** Props for {@link MessageDeliveryStatus}. */
interface MessageDeliveryStatusProps {
  status?: "pending" | "failed";
  error?: string;
  onRetry?: () => void;
  onDelete?: () => void;
}

/**
 * "Sending…" under a pending bubble, "Not sent · Retry · Delete" under a
 * failed one.
 *
 * @param props - The send state and the failed message's actions.
 * @param props.status - "pending" or "failed".
 * @param props.error - Why it failed, shown on hover.
 * @param props.onRetry - Resends it.
 * @param props.onDelete - Drops it.
 * @returns The status, or null.
 */
export default function MessageDeliveryStatus({ status, error, onRetry, onDelete }: MessageDeliveryStatusProps) {
  if (status === "pending") {
    return (
      <span className="flex items-center gap-1 text-tl-faint">
        <Clock size={11} aria-hidden />
        Sending…
      </span>
    );
  }
  if (status !== "failed") return null;
  return (
    <span className="flex items-center gap-1 font-bold text-tl-danger" title={error}>
      Not sent
      {onRetry && (
        <>
          <span aria-hidden>·</span>
          <button type="button" onClick={onRetry} className={actionClass}>
            Retry
          </button>
        </>
      )}
      {onDelete && (
        <>
          <span aria-hidden>·</span>
          <button type="button" onClick={onDelete} className={actionClass}>
            Delete
          </button>
        </>
      )}
    </span>
  );
}
