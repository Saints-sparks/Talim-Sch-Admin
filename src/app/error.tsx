"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";
import { ApiError, getErrorMessage } from "@/lib/apiError";

/**
 * Root error boundary. Anything thrown during render or in a server action
 * lands here instead of a blank screen. API errors keep their user-safe
 * message and request id; everything else gets a generic one.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    // Keep a trace for support; the UI never shows the stack.
    logger.error("app", "Unhandled error reached the root boundary", error);
  }, [error]);

  const requestId = error instanceof ApiError ? error.requestId : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-10 w-10 text-red-500 dark:text-red-400" />
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-slate-100">Something went wrong</h1>
        <p className="mb-2 text-gray-500 dark:text-slate-400">{getErrorMessage(error)}</p>
        {(requestId || error.digest) && (
          <p className="mb-6 font-mono text-xs text-gray-400 dark:text-slate-500">Reference: {requestId ?? error.digest}</p>
        )}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
          <button
            type="button"
            onClick={() => router.replace("/dashboard")}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#003366] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#002244]"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
