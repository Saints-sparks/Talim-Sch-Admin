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

interface DashboardErrorStateProps {
  error: unknown;
  onRetry: () => void;
  isRetrying: boolean;
}

/** Title, explanation and whether retrying is worth offering. */
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

export function DashboardErrorState({ error, onRetry, isRetrying }: DashboardErrorStateProps) {
  const { title, message, canRetry } = describe(error);
  const offline = error instanceof ApiError && error.code === "NETWORK_OFFLINE";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/40 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          {offline ? (
            <WifiOff className="w-7 h-7 text-red-500" />
          ) : (
            <AlertCircle className="w-7 h-7 text-red-500" />
          )}
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">{message}</p>
        {canRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="px-5 py-2.5 bg-[#003366] text-white text-sm font-semibold rounded-lg hover:bg-[#002244] transition-colors inline-flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw className={isRetrying ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
            {isRetrying ? "Retrying..." : "Try Again"}
          </button>
        )}
      </div>
    </div>
  );
}
