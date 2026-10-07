/**
 * The "Report a problem" form (Round 4 §35): its choices, its check and the
 * `POST /support/tickets` body.
 */
import {
  SUPPORT_DESCRIPTION_MAX,
  SUPPORT_DESCRIPTION_MIN,
  type CreateSupportTicketPayload,
  type SupportTicketArea,
} from "@/types/round4Contract";
import { APP_VERSION } from "@/lib/appVersion";

/** This build's version (from package.json), as Settings → Data & System shows it and tickets report it. */
export { APP_VERSION };

/** The areas a problem can be about, in menu order. */
export const SUPPORT_AREAS: ReadonlyArray<{ value: SupportTicketArea; label: string }> = [
  { value: "grading", label: "Grading and results" },
  { value: "attendance", label: "Attendance" },
  { value: "timetable", label: "Timetable" },
  { value: "messages", label: "Messages" },
  { value: "signing_in", label: "Signing in" },
  { value: "other", label: "Something else" },
];

/** What the form holds. */
export interface SupportTicketValues {
  area: SupportTicketArea | "";
  description: string;
}

/** Messages per field; empty when the form can be sent. */
export type SupportTicketErrors = Partial<Record<keyof SupportTicketValues, string>>;

/**
 * Checks the form.
 *
 * @param values - The form.
 * @returns A message per field that needs fixing.
 */
export function validateSupportTicket(values: SupportTicketValues): SupportTicketErrors {
  const errors: SupportTicketErrors = {};
  if (!values.area) errors.area = "Choose what the problem is about.";
  const length = values.description.trim().length;
  if (length < SUPPORT_DESCRIPTION_MIN) {
    errors.description = `Describe the problem in at least ${SUPPORT_DESCRIPTION_MIN} characters.`;
  } else if (length > SUPPORT_DESCRIPTION_MAX) {
    errors.description = `Keep it to ${SUPPORT_DESCRIPTION_MAX} characters or fewer.`;
  }
  return errors;
}

/**
 * The request body, with where the problem was reported from.
 *
 * @param values - A valid form (see {@link validateSupportTicket}).
 * @param context - The page path and the browser's user agent.
 * @returns The body for `POST /support/tickets`.
 */
export function toSupportTicketPayload(
  values: SupportTicketValues,
  context: { path: string; userAgent: string }
): CreateSupportTicketPayload {
  return {
    area: values.area as SupportTicketArea,
    description: values.description.trim(),
    context: { path: context.path, appVersion: APP_VERSION, userAgent: context.userAgent },
  };
}
