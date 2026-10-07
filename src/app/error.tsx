"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";
import { ApiError, getErrorMessage } from "@/lib/apiError";
import { StatusScreen } from "@/components/tl/StatusScreen";
import { ghostButton, primaryButton } from "@/components/tl/styles";

/**
 * Root error boundary. Anything thrown during render or in a server action
 * lands here instead of a blank screen. API errors keep their user-safe
 * message and request id; everything else gets a generic one.
 *
 * @param props - What was thrown and Next's reset.
 * @param props.error - The error; `digest` is the server's reference for it.
 * @param props.reset - Renders the page again.
 * @returns The error screen.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Keep a trace for support; the UI never shows the stack.
    logger.error("app", "Unhandled error reached the root boundary", error);
  }, [error]);

  const requestId = error instanceof ApiError ? error.requestId : undefined;
  const reference = requestId ?? error.digest;

  return (
    <StatusScreen
      tone="danger"
      icon={<AlertTriangle />}
      eyebrowText="Error"
      title="Something went wrong"
      description={getErrorMessage(error)}
      actions={
        <>
          <button type="button" onClick={reset} className={`${ghostButton} flex-1`}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Try again
          </button>
          <button
            type="button"
            onClick={() => router.replace("/dashboard")}
            className={`${primaryButton} flex-1`}
          >
            <Home className="h-4 w-4" aria-hidden />
            Go to Dashboard
          </button>
        </>
      }
      footnote={
        reference ? (
          <p>
            If it keeps happening, email support@mytalim.com and quote reference{" "}
            <code className="rounded bg-tl-track px-1.5 py-0.5 font-mono text-[12px] text-tl-ink">
              {reference}
            </code>
            .
          </p>
        ) : undefined
      }
    />
  );
}
