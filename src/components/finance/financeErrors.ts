/**
 * Turning a failed money request into something a school admin can act on.
 *
 * Branching happens on `ApiError.code`, never on the message text: the codes
 * are part of the API contract (`talimBE-V2/src/common/http/api-error-code.enum.ts`)
 * while the messages are free to change.
 */
import { ApiError, getErrorMessage } from "@/lib/apiError";

/** A failure rendered as a title, a body and whether retrying could help. */
export interface FinanceErrorCopy {
  title: string;
  message: string;
  /** False for failures a retry cannot fix, so no "Try again" button is offered. */
  retryable: boolean;
}

/**
 * Describes a failed finance read for `ErrorState`.
 *
 * @param error - Whatever the query threw.
 * @param subject - What was being loaded, e.g. "wallet balances".
 * @returns Title, message and whether a retry button makes sense.
 */
export function describeFinanceError(error: unknown, subject: string): FinanceErrorCopy {
  const fallback = `We couldn't load ${subject}.`;
  if (!(error instanceof ApiError)) {
    return { title: "Something went wrong", message: getErrorMessage(error, fallback), retryable: true };
  }

  switch (error.code) {
    case "FORBIDDEN":
      return {
        title: "No access to finance",
        message: "Your account doesn't have the finance permission. Ask your school admin for access.",
        retryable: false,
      };
    case "TENANT_MISMATCH":
      return {
        title: "Wrong school",
        message: "That data belongs to another school. Sign out and back in to refresh your session.",
        retryable: false,
      };
    case "WALLET_UNAVAILABLE":
      return {
        title: "Wallet unavailable",
        message: error.message,
        retryable: false,
      };
    case "NOT_FOUND":
      return { title: "Nothing here", message: error.message, retryable: false };
    case "NETWORK_OFFLINE":
      return {
        title: "You're offline",
        message: "Reconnect and try again — no figures on screen are current while you're offline.",
        retryable: true,
      };
    case "RATE_LIMITED":
      return { title: "Too many requests", message: error.message, retryable: true };
    default:
      return {
        title: error.isTransient ? "Couldn't reach the server" : "Something went wrong",
        message: error.message || fallback,
        retryable: error.isTransient,
      };
  }
}

/**
 * The message to toast after a failed finance write.
 *
 * Keeps the server's wording for the cases that tell the admin what to do next
 * (insufficient balance, daily limit, a state that already moved on) and falls
 * back to the supplied text otherwise.
 *
 * @param error - Whatever the mutation threw.
 * @param fallback - Shown when the error carries nothing usable.
 * @returns A message safe to put in a toast.
 */
export function financeActionMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.code === "VALIDATION_FAILED") {
      const first = Object.values(error.fieldErrors())[0];
      if (first) return first;
    }
    if (error.code === "FORBIDDEN") return "You don't have permission to do that.";
    return error.message || fallback;
  }
  return getErrorMessage(error, fallback);
}
