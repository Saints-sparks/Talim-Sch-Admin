import { ApiError, getErrorMessage } from "@/lib/apiError";

/** What the dialogs show after a create request fails. */
export interface CreateFailure {
  /** The headline for the banner and the toast. */
  message: string;
  /** Problems the server tied to a field, keyed by the server's field name. */
  fieldErrors: Record<string, string>;
  /** The server's `error.code`, or `null` when the failure was not an `ApiError`. */
  code: ApiError["code"] | null;
}

/** Options for {@link describeCreateFailure}. */
export interface DescribeFailureOptions {
  /** "teacher" or "student" — used in the sentence. */
  resource: "teacher" | "student";
  /**
   * True when the login account was already created and only the profile
   * failed. A retry then continues from the profile, so a conflict on the email
   * cannot be the cause.
   */
  accountCreated: boolean;
}

/**
 * Pulls a field name out of a class-validator sentence such as
 * `"parentContact.email must be an email"`. The API answers with those bare
 * strings (no `field`) for DTO failures, so the sentence is the only clue.
 *
 * @param reason - One validation message.
 * @returns The leading property path, or `null` when the sentence does not start with one.
 */
export function fieldFromReason(reason: string): string | null {
  const match = /^([A-Za-z_][\w]*(?:\.[\w]+)*) (?:must|should|is|has|contains)\b/.exec(reason.trim());
  return match ? match[1] : null;
}

/**
 * Turns a failed create into text the admin can act on: the server's own
 * message, its field-level problems, and a sentence that says how far the
 * create got.
 *
 * @param error - Whatever the create mutation threw.
 * @param options - Which resource, and whether the account already exists.
 * @returns The message, the per-field errors and the server's code.
 */
export function describeCreateFailure(error: unknown, options: DescribeFailureOptions): CreateFailure {
  const { resource, accountCreated } = options;
  const fallback = `We couldn't add this ${resource}. Please try again.`;

  if (!(error instanceof ApiError)) {
    return { message: getErrorMessage(error, fallback), fieldErrors: {}, code: null };
  }

  const fieldErrors: Record<string, string> = { ...error.fieldErrors() };
  const loose: string[] = [];
  for (const detail of error.details) {
    if (detail.field) continue;
    const inferred = fieldFromReason(detail.reason);
    if (inferred && !fieldErrors[inferred]) fieldErrors[inferred] = detail.reason;
    else if (!inferred) loose.push(detail.reason);
  }

  let message: string;
  if (error.code === "CONFLICT" && !accountCreated) {
    message = "An account with that email already exists.";
    fieldErrors.email = message;
  } else if (error.code === "FORBIDDEN") {
    message = `You don't have permission to add ${resource}s.`;
  } else if (error.code === "TENANT_MISMATCH") {
    message = "That belongs to a different school. Sign in again and retry.";
  } else if (error.code === "VALIDATION_FAILED" || error.code === "BAD_REQUEST") {
    const extra = loose.length > 0 ? `: ${loose.join("; ")}` : "";
    message = `${error.message.replace(/\.$/, "")}${extra}`;
  } else {
    message = error.message || fallback;
  }

  if (accountCreated) {
    const cause = /[.!?]$/.test(message) ? message : `${message}.`;
    message = `The ${resource}'s login account was created, but the profile was not saved. ${cause} Fix it and press the button again to finish.`;
  }

  return { message, fieldErrors, code: error.code };
}
