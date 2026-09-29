/**
 * The term-results queue's rules and wording, free of React so they can be
 * tested directly (Round 3, §21–§23).
 */
import type { AcademicYearResponse, TermResponse } from "@/app/services/academic.service";
import {
  REMARK_MAX_LENGTH,
  RETURN_REASON_MAX_LENGTH,
  type Broadsheet,
  type GradingConflict,
  type GradingPerson,
  type ResultPosition,
  type TermRemarkRow,
  type TermResultStatus,
  type TermResultSubmission,
  type WaitingSubject,
} from "@/types/gradingContract";

/** The queue's tabs, in order. */
export const STATUS_TABS: readonly { status: TermResultStatus; label: string; empty: string }[] = [
  {
    status: "submitted",
    label: "Submitted",
    empty: "Nothing is waiting for review. Results appear here when a class teacher submits them.",
  },
  {
    status: "returned",
    label: "Returned",
    empty: "No results are back with a class teacher.",
  },
  {
    status: "published",
    label: "Published",
    empty: "No results have been published this term.",
  },
];

/** One entry of the term picker. */
export interface TermOption {
  id: string;
  label: string;
  isCurrent: boolean;
}

/**
 * The term picker's entries, labelled "2025/2026 · First Term" when the
 * academic year is known.
 *
 * @param terms - The school's terms.
 * @param years - The school's academic years.
 * @returns The entries, in the order the API lists the terms.
 */
export function termOptions(
  terms: readonly TermResponse[],
  years: readonly AcademicYearResponse[]
): TermOption[] {
  const names = new Map(years.map((y) => [y._id, y.year]));
  return terms.map((t) => ({
    id: t._id,
    label: names.has(t.academicYearId) ? `${names.get(t.academicYearId)} · ${t.name}` : t.name,
    isCurrent: t.isCurrent,
  }));
}

/**
 * The term the page opens on: the one picked, else the current term, else the first.
 *
 * @param options - From {@link termOptions}.
 * @param picked - The term the admin chose, or "".
 * @returns The term id, or "" when the school has no terms.
 */
export function activeTermId(options: readonly TermOption[], picked: string): string {
  if (picked && options.some((o) => o.id === picked)) return picked;
  return options.find((o) => o.isCurrent)?.id ?? options[0]?.id ?? "";
}

/**
 * The basis in words: the label the API sends ("Term total" or the
 * assessment's name). The API sends an empty label for an assessment it can
 * no longer find, which reads as "Single assessment".
 *
 * @param basis - The submission's basis, `{ key, label }`.
 * @returns The label.
 */
export function basisLabel(basis: TermResultSubmission["basis"]): string {
  return basis.label || (basis.key === "total" ? "Term total" : "Single assessment");
}

/**
 * A person the submission names (who submitted, returned or published it).
 *
 * @param person - `{ id, name }`, or null when nobody is recorded.
 * @returns The name, or "Unknown" when there is none (e.g. a deleted account).
 */
export function personName(person: GradingPerson | null): string {
  return person?.name || "Unknown";
}

/**
 * A date and time for the queue, in the viewer's locale.
 *
 * @param iso - An ISO timestamp.
 * @returns E.g. "28 Sept 2026, 14:05", or "—" when missing or unreadable.
 */
export function formatWhen(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/**
 * How many students still lack a class teacher remark, in words.
 *
 * @param count - The count.
 * @returns "All in", "1 missing" or "4 missing".
 */
export function missingRemarksLabel(count: number): string {
  return count > 0 ? `${count} missing` : "All in";
}

/**
 * "1st", "2nd", "3rd", "11th", "22nd"…
 *
 * @param n - A positive whole number.
 * @returns The ordinal.
 */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  const suffix = ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${suffix}`;
}

/**
 * A position as the broadsheet shows it.
 *
 * @param position - The rank and class size, or null for a student not ranked.
 * @returns E.g. "2nd of 31", or "—".
 */
export function positionLabel(position: ResultPosition | null): string {
  return position ? `${ordinal(position.rank)} of ${position.of}` : "—";
}

/**
 * A percentage, as the API rounds it (1 decimal).
 *
 * @param value - The percent, or null.
 * @returns E.g. "67.5%", or "—".
 */
export function formatPercent(value: number | null): string {
  return value === null || value === undefined ? "—" : `${value}%`;
}

/**
 * One subject cell of the broadsheet: a percent on a term-total basis, a
 * score on an assessment basis.
 *
 * @param value - The cell.
 * @param basis - The broadsheet's basis.
 * @returns The text.
 */
export function formatCell(value: number | null, basis: Broadsheet["basis"]): string {
  if (value === null || value === undefined) return "—";
  return basis.maxPerSubject === null ? `${value}%` : String(value);
}

/**
 * What each subject column holds, for the table's caption and header.
 *
 * @param basis - The broadsheet's basis.
 * @returns E.g. "Subject totals (%)" or "Scores out of 40".
 */
export function cellUnit(basis: Broadsheet["basis"]): string {
  return basis.maxPerSubject === null
    ? "Subject totals (%)"
    : `Scores out of ${basis.maxPerSubject}`;
}

/**
 * Whether the office can publish or return the submission. Only a submitted
 * one waits on the office; a returned one is with the class teacher and a
 * published one is out.
 *
 * @param submission - The submission.
 * @returns True for `submitted`.
 */
export function awaitsOffice(submission: Pick<TermResultSubmission, "status">): boolean {
  return submission.status === "submitted";
}

/**
 * Whether the remarks are locked. The API refuses remark changes (409
 * `RESULTS_PUBLISHED`) once the class's results for the term are published;
 * this submission being published is the case the screen can see up front.
 * Another basis's publication for the same class and term only shows when a
 * save is refused, and the screen then locks the remarks too.
 *
 * @param submission - The submission.
 * @returns True once published.
 */
export function remarksLocked(submission: Pick<TermResultSubmission, "status">): boolean {
  return submission.status === "published";
}

/**
 * What the remarks panel says when the remarks are locked.
 *
 * @param submission - The submission.
 * @returns The note.
 */
export function remarksLockedNote(
  submission: Pick<TermResultSubmission, "class" | "term">
): string {
  return `Remarks are locked: ${submission.class.name}'s results for ${submission.term.name} are published.`;
}

/**
 * Names subjects that are not published for the basis.
 *
 * @param waitingOn - The subjects.
 * @returns E.g. "English", "English and Mathematics", "Art, English and Mathematics".
 */
function subjectList(waitingOn: readonly WaitingSubject[]): string {
  const titles = waitingOn.map((w) => w.title);
  if (titles.length <= 1) return titles[0] ?? "";
  return `${titles.slice(0, -1).join(", ")} and ${titles[titles.length - 1]}`;
}

/**
 * Why publishing is blocked because a subject is no longer published (it was
 * unlocked for a correction since the submission).
 *
 * @param waitingOn - The subjects, from the broadsheet or the publish 409.
 * @returns The explanation.
 */
export function notPublishedMessage(waitingOn: readonly WaitingSubject[]): string {
  if (waitingOn.length === 0) {
    return "A subject is no longer published. Return the results, or wait until its teacher publishes again.";
  }
  return waitingOn.length === 1
    ? `${subjectList(waitingOn)} is no longer published. Return the results, or wait until its teacher publishes again.`
    : `${subjectList(waitingOn)} are no longer published. Return the results, or wait until their teachers publish again.`;
}

/**
 * Explains a 409 from publish or return: another member of staff acted first
 * (`{ code, status }`), or, for publish, a subject was unlocked since the
 * submission (`{ waitingOn }`).
 *
 * @param conflict - From `gradingConflict()`.
 * @param className - The class, to name in the message.
 * @returns The message, or undefined when the 409 carries neither (the
 *   caller falls back to the API's message).
 */
export function officeConflictMessage(
  conflict: GradingConflict | null,
  className: string
): string | undefined {
  if (!conflict) return undefined;
  if (conflict.waitingOn) return notPublishedMessage(conflict.waitingOn);
  if (conflict.status === "published") return `${className} results are already published.`;
  if (conflict.status === "returned") {
    return `${className} results were already returned to the class teacher.`;
  }
  return undefined;
}

/**
 * Checks the return reason.
 *
 * @param reason - The text.
 * @returns The problem, or undefined.
 */
export function validateReturnReason(reason: string): string | undefined {
  if (!reason.trim()) return "Give a reason so the class teacher knows what to fix.";
  if (reason.trim().length > RETURN_REASON_MAX_LENGTH) {
    return `Keep the reason to ${RETURN_REASON_MAX_LENGTH} characters.`;
  }
  return undefined;
}

/**
 * Checks one principal's remark.
 *
 * @param remark - The text.
 * @returns The problem, or undefined.
 */
export function validateRemark(remark: string): string | undefined {
  return remark.trim().length > REMARK_MAX_LENGTH
    ? `Keep the remark to ${REMARK_MAX_LENGTH} characters.`
    : undefined;
}

/** Principal's remarks being typed, by student id. Students not in the map show the saved remark. */
export type RemarkEdits = Record<string, string>;

/**
 * The text a student's principal remark box shows.
 *
 * @param row - The student's remarks row.
 * @param edits - Unsaved edits.
 * @returns The text.
 */
export function remarkValue(row: TermRemarkRow, edits: RemarkEdits): string {
  return edits[row.student.id] ?? row.principalRemark;
}

/**
 * The principal's remarks that differ from what is saved: the body of the
 * save, trimmed. An emptied box clears the remark.
 *
 * @param rows - The saved rows.
 * @param edits - Unsaved edits.
 * @returns `{ studentId, principalRemark }` for each changed student.
 */
export function changedPrincipalRemarks(
  rows: readonly TermRemarkRow[],
  edits: RemarkEdits
): { studentId: string; principalRemark: string }[] {
  return rows.flatMap((row) => {
    const edit = edits[row.student.id];
    if (edit === undefined) return [];
    const next = edit.trim();
    return next === row.principalRemark.trim()
      ? []
      : [{ studentId: row.student.id, principalRemark: next }];
  });
}

/**
 * The students still without a class teacher remark.
 *
 * @param rows - The remarks rows.
 * @returns Their names.
 */
export function studentsMissingRemarks(rows: readonly TermRemarkRow[]): string[] {
  return rows.filter((r) => !r.classTeacherRemark.trim()).map((r) => r.student.name);
}
