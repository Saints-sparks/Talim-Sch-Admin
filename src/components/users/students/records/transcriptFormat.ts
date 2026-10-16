/**
 * Wording for the transcript (Records tab and its printout).
 */
import type {
  StudentStatus,
  StudentTranscript,
  TranscriptTerm,
} from "@/app/services/student.service";
import type { Tone } from "@/components/tl";
import { formatCalendarDate } from "@/lib/dates";

/** How a session or a school stay ended, in plain words. */
const OUTCOMES: Record<string, { label: string; tone: Tone }> = {
  continuing: { label: "Continuing", tone: "info" },
  promoted: { label: "Promoted", tone: "success" },
  repeated: { label: "Repeated", tone: "warning" },
  graduated: { label: "Graduated", tone: "accent" },
  withdrawn: { label: "Withdrew", tone: "warning" },
  transferred: { label: "Transferred", tone: "muted" },
  completed: { label: "Completed", tone: "success" },
};

/**
 * An outcome's label and tone.
 *
 * @param outcome - The transcript's outcome, if any.
 * @returns The label and tone, or `null` when there is none.
 */
export function outcomeLabel(
  outcome: string | null | undefined
): { label: string; tone: Tone } | null {
  if (!outcome) return null;
  return (
    OUTCOMES[outcome] ?? {
      label: outcome.charAt(0).toUpperCase() + outcome.slice(1),
      tone: "muted",
    }
  );
}

/** A student status in plain words. */
export const STATUS_LABEL: Record<StudentStatus, string> = {
  active: "Current student",
  graduated: "Graduated",
  withdrawn: "Withdrawn",
  left_talim: "Left Talim",
};

/**
 * An ordinal ("1st", "22nd", "13th").
 *
 * @param n - The number.
 * @returns The ordinal.
 */
export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

/**
 * A term's position ("7th of 49"), or a dash.
 *
 * @param term - The term.
 * @returns The position.
 */
export function positionText(term: Pick<TranscriptTerm, "position" | "of">): string {
  if (term.position == null) return "—";
  return term.of ? `${ordinal(term.position)} of ${term.of}` : ordinal(term.position);
}

/**
 * A term's attendance ("59 of 62 days"), or a dash.
 *
 * @param term - The term.
 * @returns The attendance.
 */
export function attendanceText(term: Pick<TranscriptTerm, "attendance">): string {
  const a = term.attendance;
  if (!a) return "—";
  return `${a.present} of ${a.daysOpen} days`;
}

/**
 * A score or average to at most one decimal, or a dash.
 *
 * @param value - The number.
 * @param suffix - Appended when there is a number ("%").
 * @returns The text.
 */
export function num(value: number | null | undefined, suffix = ""): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value * 10) / 10}${suffix}`;
}

/**
 * A calendar date (school from/to, date of birth, `leftAt`) as "14 Sep 2020",
 * the same day in every time zone.
 *
 * @param value - The date.
 * @returns The date, or a dash.
 */
export function day(value: string | null | undefined): string {
  return formatCalendarDate(value, { format: { day: "numeric", month: "short", year: "numeric" } });
}

/**
 * A moment (issued, generated) as the day it was in the viewer's time zone,
 * e.g. "14 Sep 2020".
 *
 * @param value - The ISO timestamp.
 * @returns The date, or a dash.
 */
export function issuedDay(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * How many published terms a transcript holds.
 *
 * @param transcript - The transcript.
 * @returns The count.
 */
export function termCount(transcript: Pick<StudentTranscript, "sessions">): number {
  return transcript.sessions.reduce((sum, session) => sum + session.terms.length, 0);
}
