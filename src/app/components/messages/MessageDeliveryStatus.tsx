"use client";

import { Clock } from "lucide-react";

interface MessageDeliveryStatusProps {
  status?: "pending" | "failed";
  error?: string;
  onRetry?: () => void;
  onDelete?: () => void;
}

/** "Sending…" under a pending bubble, "Not sent · Retry · Delete" under a failed one. */
export default function MessageDeliveryStatus({ status, error, onRetry, onDelete }: MessageDeliveryStatusProps) {
  if (status === "pending") {
    return (
      <span className="flex items-center gap-1 text-gray-400">
        <Clock size={11} aria-hidden />
        Sending…
      </span>
    );
  }
  if (status !== "failed") return null;
  return (
    <span className="flex items-center gap-1 text-red-500" title={error}>
      Not sent
      {onRetry && (
        <>
          <span aria-hidden>·</span>
          <button type="button" onClick={onRetry} className="font-medium underline-offset-2 hover:underline">
            Retry
          </button>
        </>
      )}
      {onDelete && (
        <>
          <span aria-hidden>·</span>
          <button type="button" onClick={onDelete} className="font-medium underline-offset-2 hover:underline">
            Delete
          </button>
        </>
      )}
    </span>
  );
}
