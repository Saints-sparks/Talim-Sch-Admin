"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { ApiError } from "@/lib/apiError";
import { cn } from "@/lib/utils";
import { surface, text } from "@/components/transit/ui";

/** What to tell the admin, per error code, when a transit request fails. */
const MESSAGES: Partial<Record<string, { title: string; message: string; retry: boolean }>> = {
  NETWORK_OFFLINE: {
    title: "You're offline",
    message: "Reconnect and we'll pick up where you left off.",
    retry: true,
  },
  REQUEST_TIMEOUT: {
    title: "That took too long",
    message: "The server didn't answer in time. Try again in a moment.",
    retry: true,
  },
  SERVICE_UNAVAILABLE: {
    title: "Transit is unavailable",
    message: "The service is down for the moment. Try again shortly.",
    retry: true,
  },
  INTERNAL_ERROR: {
    title: "Something went wrong",
    message: "The server couldn't complete that. Try again, and tell us if it keeps happening.",
    retry: true,
  },
  FORBIDDEN: {
    title: "You don't have access to this",
    message: "Ask your school administrator for the Transit permission.",
    retry: false,
  },
  NOT_FOUND: {
    title: "We couldn't find that",
    message: "It may have been removed, or it belongs to another school.",
    retry: false,
  },
  TENANT_MISMATCH: {
    title: "That belongs to another school",
    message: "Sign in to the school that owns this record.",
    retry: false,
  },
};

/**
 * An error panel keyed on the API's error code, so a 403 never offers a retry
 * button that would only fail again.
 */
export function TransitErrorState({
  error,
  onRetry,
  fallbackTitle = "We couldn't load this",
}: {
  error: unknown;
  onRetry?: () => void;
  fallbackTitle?: string;
}) {
  const code = error instanceof ApiError ? error.code : "UNKNOWN";
  const known = MESSAGES[code];
  const title = known?.title ?? fallbackTitle;
  const message =
    known?.message ??
    (error instanceof ApiError ? error.message : "Please try again in a moment.");
  const canRetry = (known?.retry ?? true) && Boolean(onRetry);

  return (
    <div className={cn("rounded-xl p-8 text-center shadow-sm", surface.card)}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/15">
        <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
      </div>
      <p className={cn("text-lg font-semibold", text.strong)}>{title}</p>
      <p className={cn("mt-1 text-sm", text.muted)}>{message}</p>
      {canRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#003366] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#003366]/90"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}

/** The "nothing here yet" panel, with an optional call to action. */
export function TransitEmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl py-16 text-center shadow-sm", surface.card)}>
      <Icon className={cn("mx-auto mb-3 h-10 w-10 opacity-30", text.muted)} />
      <p className={cn("font-medium", text.strong)}>{title}</p>
      <p className={cn("mt-1 text-sm", text.muted)}>{message}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
