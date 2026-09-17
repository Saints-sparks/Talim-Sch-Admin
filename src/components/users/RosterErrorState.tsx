"use client";

import React from "react";
import { ErrorState } from "@/components/StateComponents";
import { ApiError, getErrorMessage } from "@/lib/apiError";

interface RosterErrorStateProps {
  /** Whatever the query threw. */
  error: unknown;
  /** What was being loaded, e.g. "students" — used in the copy. */
  resource: string;
  /** Retries the request. Hidden for errors retrying cannot fix. */
  onRetry?: () => void;
}

/** Title and body for one failure, chosen by `ApiError.code`. */
function describe(error: unknown, resource: string): { title: string; message: string; retryable: boolean } {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "FORBIDDEN":
        return {
          title: "You don't have access",
          message: `Your account is not allowed to view ${resource}. Ask a school administrator to grant you access.`,
          retryable: false,
        };
      case "UNAUTHENTICATED":
      case "TOKEN_EXPIRED":
        return {
          title: "Your session ended",
          message: "Sign in again to continue.",
          retryable: false,
        };
      case "NOT_FOUND":
        return {
          title: `No ${resource} found`,
          message: error.message,
          retryable: false,
        };
      case "NETWORK_OFFLINE":
        return {
          title: "You're offline",
          message: `We'll load ${resource} as soon as you're back online.`,
          retryable: true,
        };
      case "REQUEST_TIMEOUT":
      case "SERVICE_UNAVAILABLE":
        return {
          title: "The server didn't respond",
          message: error.message,
          retryable: true,
        };
      case "RATE_LIMITED":
        return {
          title: "Too many requests",
          message: error.message,
          retryable: true,
        };
      default:
        return {
          title: `Couldn't load ${resource}`,
          message: error.message,
          retryable: error.isTransient || error.status >= 500,
        };
    }
  }

  return {
    title: `Couldn't load ${resource}`,
    message: getErrorMessage(error, `Something went wrong loading ${resource}.`),
    retryable: true,
  };
}

/**
 * Error panel for a roster query, worded by `error.code` rather than showing
 * whatever string the server happened to send.
 */
export function RosterErrorState({ error, resource, onRetry }: RosterErrorStateProps) {
  const { title, message, retryable } = describe(error, resource);
  return <ErrorState title={title} message={message} onRetry={retryable ? onRetry : undefined} />;
}

export default RosterErrorState;
