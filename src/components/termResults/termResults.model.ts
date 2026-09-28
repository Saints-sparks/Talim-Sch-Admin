/**
 * The term-results queue's rules and wording, free of React so they can be
 * tested directly (Round 3, §21–§23).
 */
import type { AcademicYearResponse, TermResponse } from "@/app/services/academic.service";
import {
  REMARK_MAX_LENGTH,
  type Broadsheet,
  type NamedRef,
  type ResultPosition,
  type TermRemarkRow,
  type TermResultStatus,
  type TermResultSubmission,
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

/** Longest reason the return dialog takes. The contract sets no limit; this keeps the notification readable. */
export const RETURN_REASON_MAX_LENGTH = 500;

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
 * The basis a submission was made on, as the broadsheet route takes it.
 *
 * @param basis - The submission's basis: `'total'`, an assessment id, or `{ key, label }`.
 * @returns `total` or the assessment id.
 */
export function basisKey(basis: TermResultSubmission["basis"]): string {
  return typeof basis === "string" ? basis : basis.key;
}

/**
 * The basis in words: the label the API sends, else "Term total" or
 * "Single assessment".
 *
 * @param basis - The submission's basis.
 * @returns The label.
 */
export function basisLabel(basis: TermResultSubmission["basis"]): string {
  if (typeof basis !== "string")
    return basis.label || (basis.key === "total" ? "Term total" : "Single assessment");
  return basis === "total" ? "Term total" : "Single assessment";
}

/**
 * Who submitted the results.
 *
 * @param submittedBy - `{ id, name }`, a bare user id, or null.
 * @returns The name, or "Class teacher" when only an id came back.
 */
export function submitterName(submittedBy: TermResultSubmission["submittedBy"]): string {
  if (!submittedBy) return "Unknown";
  if (typeof submittedBy === "string") return "Class teacher";
  return (submittedBy as NamedRef).name || "Class teacher";
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
 * Whether the principal's remarks can still be edited. Once results are
 * published, students and parents have read them, so the screen stops
 * offering edits (the API does not forbid it; this is a product choice).
 *
 * @param submission - The submission.
 * @returns False once published.
 */
export function principalRemarksEditable(
  submission: Pick<TermResultSubmission, "status">
): boolean {
  return submission.status !== "published";
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
  return edits[row.student.id] ?? row.principalRemark ?? "";
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
    return next === (row.principalRemark ?? "").trim()
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
  return rows.filter((r) => !r.classTeacherRemark?.trim()).map((r) => r.student.name);
}
