/**
 * Turning a failed fees request into something a bursar can act on.
 *
 * Every fees call throws `ApiError` with a stable `code`, so the screens can
 * say what went wrong and whether retrying is worth it, instead of showing
 * "Request failed" or leaving a spinner turning.
 */
import { ApiError, getErrorMessage } from "@/lib/apiError";

/**
 * A user-facing message for a failed fees request, keyed on the error code.
 *
 * @param error - What the query or mutation threw.
 * @param subject - What was being loaded, e.g. "fee items". Used in the
 *   generic messages.
 * @returns The message to show.
 */
export function feesErrorMessage(error: unknown, subject = "fees"): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "NETWORK_OFFLINE":
        return `You're offline, so ${subject} can't load. Reconnect and try again.`;
      case "REQUEST_TIMEOUT":
        return `Loading ${subject} took too long. Try again.`;
      case "FORBIDDEN":
        return "You don't have access to fees for this school.";
      case "NOT_FOUND":
        return `We couldn't find those ${subject}.`;
      case "VALIDATION_FAILED":
        return error.details[0]?.reason ?? error.message;
      case "INTERNAL_ERROR":
      case "SERVICE_UNAVAILABLE":
        return `Fees are unavailable right now. Please try again in a moment.`;
      default:
        return error.message;
    }
  }
  return getErrorMessage(error, `Could not load ${subject}.`);
}

/**
 * Whether trying the same request again could plausibly work.
 *
 * @param error - What the query threw.
 * @returns True for network, timeout and server-side failures.
 */
export function isRetryableFeesError(error: unknown): boolean {
  return error instanceof ApiError ? error.isTransient : true;
}
