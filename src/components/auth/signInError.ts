/**
 * How the School Admin sign-in sorts a failed `login` into its banners.
 */

/** Why a sign-in failed, as the banner shows it. */
export type LoginError =
  | { kind: "access_denied"; message: string }
  | { kind: "invalid_credentials" }
  | { kind: "unknown"; message: string };

/**
 * Sorts a failed sign-in into the banner's three kinds, from the message the
 * auth context throws: a refused role ("Access denied", "registered as …"),
 * wrong credentials, or anything else.
 *
 * @param error - What `login` threw.
 * @returns The kind, with the message where the banner shows it.
 */
export function classifyLoginError(error: unknown): LoginError {
  const msg = error instanceof Error ? error.message : "";
  const lower = msg.toLowerCase();
  if (lower.includes("access denied") || lower.includes("registered as")) {
    return { kind: "access_denied", message: msg };
  }
  if (lower.includes("incorrect") || lower.includes("invalid") || lower.includes("credentials")) {
    return { kind: "invalid_credentials" };
  }
  return { kind: "unknown", message: msg || "An unexpected error occurred. Please try again." };
}
