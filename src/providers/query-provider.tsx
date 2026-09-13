"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "@/lib/apiError";

/**
 * Whether a failed query is worth retrying automatically. Client errors
 * (4xx) and auth failures never are; transient network/server errors get two
 * more attempts with back-off.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  if (error instanceof ApiError) return error.isTransient && !error.isAuthError && error.code !== "RATE_LIMITED";
  return true;
}

/**
 * Builds the app's QueryClient. Read-mostly data stays fresh for 30 s by
 * default (pages override per resource); nothing refetches just because the
 * window regained focus, which was the main source of duplicate requests.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: shouldRetry,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/** Provides the QueryClient to the app; one instance per browser session. */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(createQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
