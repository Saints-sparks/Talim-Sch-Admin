"use client";

/**
 * What the dashboard shows when its one required read fails.
 *
 * The message is keyed on `ApiError.code` so an administrator is told what
 * actually happened — offline, signed out, server down — instead of a generic
 * "failed to load", and retrying is only offered when retrying can help.
 */

import React from "react";
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { StatusScreen, primaryButton } from "@/components/tl";

/** Props for {@link DashboardErrorState}. */
interface DashboardErrorStateProps {
  /** What the base read threw. */
  error: unknown;
  /** Retries the read. */
  onRetry: () => void;
  /** True while the retry runs. */
  isRetrying: boolean;
}

/**
 * Title, explanation and whether retrying is worth offering.
 *
 * @param error - What the base read threw.
 * @returns The words for the screen and whether to offer a retry.
 */
function describe(error: unknown): { title: string; message: string; canRetry: boolean } {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "NETWORK_OFFLINE":
        return {
          title: "You're offline",
          message: "Reconnect and the dashboard will load.",
          canRetry: true,
        };
      case "REQUEST_TIMEOUT":
      case "SERVICE_UNAVAILABLE":
      case "INTERNAL_ERROR":
        return {
          title: "Talim isn't responding",
          message: "The server didn't answer in time. Try again in a moment.",
          canRetry: true,
        };
      case "UNAUTHENTICATED":
      case "TOKEN_EXPIRED":
        return {
          title: "Your session expired",
          message: "Sign in again to see your dashboard.",
          canRetry: false,
        };
      case "FORBIDDEN":
        return {
          title: "No access to this school",
          message: "Your account isn't allowed to view this school's dashboard.",
          canRetry: false,
        };
      case "NOT_FOUND":
        return {
          title: "School not found",
          message: "We couldn't find this school's dashboard. Contact support if this persists.",
          canRetry: false,
        };
      default:
        return { title: "Failed to Load Dashboard", message: error.message, canRetry: true };
    }
  }
  return {
    title: "Failed to Load Dashboard",
    message: getErrorMessage(error, "Something went wrong loading your dashboard."),
    canRetry: true,
  };
}

/**
 * The dashboard's whole-page error in the portals' status card: what went
 * wrong in plain words and, when it can help, a Try Again button.
 *
 * @param props - See {@link DashboardErrorStateProps}.
 * @param props.error - What the base read threw.
 * @param props.onRetry - Retry handler.
 * @param props.isRetrying - Whether the retry runs.
 * @returns The error screen.
 */
export function DashboardErrorState({ error, onRetry, isRetrying }: DashboardErrorStateProps) {
  const { title, message, canRetry } = describe(error);
  const offline = error instanceof ApiError && error.code === "NETWORK_OFFLINE";

  return (
    <StatusScreen
      tone="danger"
      icon={offline ? <WifiOff /> : <AlertCircle />}
      title={title}
      description={message}
      actions={
        canRetry ? (
          <button type="button" onClick={onRetry} disabled={isRetrying} className={primaryButton}>
            <RefreshCw className={isRetrying ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden />
            {isRetrying ? "Retrying..." : "Try Again"}
          </button>
        ) : null
      }
    />
  );
}
