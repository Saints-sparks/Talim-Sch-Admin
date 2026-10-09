"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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

/**
 * Empties a QueryClient whenever the session ends: `AuthContext.logout` and
 * a forced sign-out both raise `auth-changed` with `type: "logout"`, so one
 * admin's cached data never shows to the next one on this browser.
 *
 * @param client - The app's QueryClient.
 * @returns A function that stops listening.
 */
export function clearQueriesOnLogout(client: QueryClient): () => void {
  /**
   * Clears the cache for a logout event.
   *
   * @param event - The `auth-changed` event.
   */
  const onAuthChanged = (event: Event) => {
    if ((event as CustomEvent<{ type?: string }>).detail?.type === "logout") client.clear();
  };
  window.addEventListener("auth-changed", onAuthChanged);
  return () => window.removeEventListener("auth-changed", onAuthChanged);
}

/**
 * Provides the QueryClient to the app; one instance per browser session,
 * emptied on every sign-out ({@link clearQueriesOnLogout}).
 *
 * @param props - Standard children.
 * @param props.children - The app tree.
 * @returns The provider element.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(createQueryClient);
  useEffect(() => clearQueriesOnLogout(client), [client]);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
