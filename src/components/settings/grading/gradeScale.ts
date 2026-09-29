/**
 * The grade scale editor's rules, free of React so they can be tested
 * directly (Settings → Grading, `PATCH /settings/academic`, Round 3 §16).
 *
 * A scale is a list of bands, highest first; a band's `min` is the lowest
 * percent that earns its letter, and a band runs up to (not including) the
 * next band's minimum. The checks mirror the API's: letters are unique,
 * minimums strictly descend, and the last minimum is 0 so every score gets a
 * grade. The editor adds its own: every field is filled in, and minimums and
 * the pass mark are percentages.
 *
 * Because minimums must descend, the order of the rows is fixed by their
 * minimums. "Moving" a grade up or down therefore swaps its letter and
 * remark with its neighbour's and leaves the minimums where they are.
 */
import type { GradeBand, GradeBandInput } from "@/types/gradingContract";

/** One row of the editor. Minimum is the input's text. */
export interface BandDraft {
  /** Local row id for React keys and error lookup; never sent. */
  id: string;
  letter: string;
  min: string;
  remark: string;
}

/** The editable fields of a row. */
export type BandField = "letter" | "min" | "remark";

/** Messages per row id and field. */
export type BandErrors = Record<string, Partial<Record<BandField, string>>>;

/** Every message the grading form can show. */
export interface GradingErrors {
  bands: BandErrors;
  passMark?: string;
  /** About the scale as a whole (e.g. no grades at all). */
  scale?: string;
}

/** The scale a school starts with, and what "Reset to default" restores. */
export const DEFAULT_GRADE_SCALE: readonly GradeBand[] = [
  { letter: "A", min: 70, remark: "Excellent" },
  { letter: "B", min: 60, remark: "Very good" },
  { letter: "C", min: 50, remark: "Good" },
  { letter: "D", min: 45, remark: "Fair" },
  { letter: "E", min: 40, remark: "Pass" },
  { letter: "F", min: 0, remark: "Fail" },
];

/** The pass mark a school starts with, in percent. */
export const DEFAULT_PASS_MARK = 50;

/** Longest letter the editor takes, e.g. "A1" or "B+". */
export const LETTER_MAX_LENGTH = 4;
/** Longest remark the editor takes. */
export const BAND_REMARK_MAX_LENGTH = 60;

/** A plain decimal: digits, optionally a point and more digits. */
const DECIMAL = /^\d+(\.\d+)?$/;

let rowCounter = 0;
/** A fresh local row id. */
function nextRowId(): string {
  rowCounter += 1;
  return `band-${rowCounter}`;
}

/**
 * Reads a percentage field.
 *
 * @param value - The input's text.
 * @returns The percent, or null when it is not a number from 0 to 100.
 */
export function parsePercent(value: string): number | null {
  const text = value.trim();
  if (!DECIMAL.test(text)) return null;
  const n = Number(text);
  return n >= 0 && n <= 100 ? n : null;
}

/**
 * Turns a saved scale into editor rows. An empty scale (which the API never
 * sends; it fills in the default) gets the default one.
 *
 * @param scale - The saved bands, highest first.
 * @returns The rows.
 */
export function toBandDrafts(scale?: readonly GradeBand[] | null): BandDraft[] {
  const source = scale && scale.length > 0 ? scale : DEFAULT_GRADE_SCALE;
  return source.map((b) => ({ id: nextRowId(), letter: b.letter, min: String(b.min), remark: b.remark ?? "" }));
}

/**
 * The pass mark field's starting text.
 *
 * @param passMark - The saved pass mark, if the API sent one.
 * @returns The text.
 */
export function toPassMarkText(passMark?: number | null): string {
  return String(passMark ?? DEFAULT_PASS_MARK);
}

/**
 * Adds an empty grade. It goes just above the last grade when that one
 * starts at 0 (the floor stays last), with a minimum halfway between its
 * neighbours when there is room; otherwise it goes at the end.
 *
 * @param rows - The rows so far.
 * @returns The rows with the new one, and its id (to focus it).
 */
export function addBand(rows: readonly BandDraft[]): { rows: BandDraft[]; id: string } {
  const id = nextRowId();
  const last = rows[rows.length - 1];
  if (!last || parsePercent(last.min) !== 0) {
    return { rows: [...rows, { id, letter: "", min: "", remark: "" }], id };
  }
  const above = rows.length > 1 ? parsePercent(rows[rows.length - 2].min) : 100;
  const mid = above !== null && above > 1 ? String(Math.floor(above / 2)) : "";
  const band: BandDraft = { id, letter: "", min: mid, remark: "" };
  return { rows: [...rows.slice(0, -1), band, last], id };
}

/**
 * Removes a grade.
 *
 * @param rows - The rows.
 * @param id - The row to remove.
 * @returns The remaining rows.
 */
export function removeBand(rows: readonly BandDraft[], id: string): BandDraft[] {
  return rows.filter((r) => r.id !== id);
}

/**
 * Changes fields of one row.
 *
 * @param rows - The rows.
 * @param id - The row to change.
 * @param patch - The new values.
 * @returns The updated rows.
 */
export function updateBand(
  rows: readonly BandDraft[],
  id: string,
  patch: Partial<Pick<BandDraft, BandField>>
): BandDraft[] {
  return rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
}

/**
 * Moves a grade up or down: its letter and remark swap with the neighbour's,
 * the minimums stay in place (and so stay in descending order). Row ids
 * travel with the letters, so focus and errors follow the grade that moved.
 *
 * @param rows - The rows.
 * @param index - The row to move.
 * @param direction - -1 for up (a higher grade), 1 for down.
 * @returns The rows, unchanged when the move would leave the list.
 */
export function moveBand(rows: readonly BandDraft[], index: number, direction: -1 | 1): BandDraft[] {
  const other = index + direction;
  if (index < 0 || index >= rows.length || other < 0 || other >= rows.length) return [...rows];
  const next = [...rows];
  const a = rows[index];
  const b = rows[other];
  next[index] = { ...b, min: a.min };
  next[other] = { ...a, min: b.min };
  return next;
}

/**
 * Whether the readable minimums descend. Rows with an unreadable minimum are
 * left out of the comparison.
 *
 * @param rows - The rows.
 * @returns True when no readable minimum is at or above the one before it.
 */
export function isDescending(rows: readonly BandDraft[]): boolean {
  let previous: number | null = null;
  for (const row of rows) {
    const min = parsePercent(row.min);
    if (min === null) continue;
    if (previous !== null && min >= previous) return false;
    previous = min;
  }
  return true;
}

/**
 * Sorts whole rows by minimum, highest first; unreadable minimums go last.
 *
 * @param rows - The rows.
 * @returns The sorted rows.
 */
export function sortBands(rows: readonly BandDraft[]): BandDraft[] {
  return [...rows].sort((a, b) => (parsePercent(b.min) ?? -1) - (parsePercent(a.min) ?? -1));
}

/**
 * Checks the scale and the pass mark.
 *
 * @param rows - The scale, highest first.
 * @param passMark - The pass mark field's text.
 * @returns Messages per row and field; see {@link hasGradingErrors}.
 */
export function validateGrading(rows: readonly BandDraft[], passMark: string): GradingErrors {
  const bands: BandErrors = {};
  const set = (id: string, field: BandField, message: string) => {
    bands[id] = { ...bands[id], [field]: bands[id]?.[field] ?? message };
  };

  const seen = new Map<string, string>();
  let previous: { letter: string; min: number } | null = null;
  rows.forEach((row, index) => {
    const letter = row.letter.trim();
    if (!letter) {
      set(row.id, "letter", "Enter a letter.");
    } else {
      const key = letter.toUpperCase();
      if (seen.has(key)) set(row.id, "letter", `${seen.get(key)} is already used. Letters must be unique.`);
      else seen.set(key, letter);
    }

    const min = parsePercent(row.min);
    if (!row.min.trim()) set(row.id, "min", "Enter the minimum percent.");
    else if (min === null) set(row.id, "min", "Use a percentage from 0 to 100.");
    else if (previous && min >= previous.min) {
      set(row.id, "min", `Must be lower than ${previous.letter || "the grade above"}'s ${previous.min}%.`);
    } else if (index === rows.length - 1 && min !== 0) {
      set(row.id, "min", "The last grade must start at 0% so every score gets a grade.");
    }
    if (min !== null) previous = { letter, min };

    if (row.remark.trim().length > BAND_REMARK_MAX_LENGTH) {
      set(row.id, "remark", `Keep the remark to ${BAND_REMARK_MAX_LENGTH} characters.`);
    }
  });

  const errors: GradingErrors = { bands };
  if (rows.length === 0) errors.scale = "Add at least one grade.";
  if (!passMark.trim()) errors.passMark = "Enter the pass mark.";
  else if (parsePercent(passMark) === null) errors.passMark = "Use a percentage from 0 to 100.";
  return errors;
}

/**
 * Whether a validation result blocks saving.
 *
 * @param errors - From {@link validateGrading}.
 * @returns True when anything has a message.
 */
export function hasGradingErrors(errors: GradingErrors): boolean {
  return Boolean(errors.scale || errors.passMark) || Object.values(errors.bands).some((e) => Object.keys(e).length > 0);
}

/**
 * The `PATCH /settings/academic` body for this section. Only the grading
 * fields go, so the School Day & Bells settings are left alone.
 *
 * @param rows - A valid scale.
 * @param passMark - A valid pass mark.
 * @returns The body.
 */
export function toGradingPayload(
  rows: readonly BandDraft[],
  passMark: string
): { gradeScale: GradeBandInput[]; passMark: number } {
  return {
    gradeScale: rows.map((r) => {
      const remark = r.remark.trim();
      return { letter: r.letter.trim(), min: parsePercent(r.min) ?? 0, ...(remark ? { remark } : {}) };
    }),
    passMark: parsePercent(passMark) ?? DEFAULT_PASS_MARK,
  };
}

/**
 * Whether the form differs from what is saved.
 *
 * @param rows - The scale being edited.
 * @param passMark - The pass mark field's text.
 * @param saved - The saved scale and pass mark.
 * @returns True when a save would change something.
 */
export function isGradingDirty(
  rows: readonly BandDraft[],
  passMark: string,
  saved: { gradeScale?: readonly GradeBand[] | null; passMark?: number | null }
): boolean {
  const current = toGradingPayload(rows, passMark);
  const original = toGradingPayload(toBandDrafts(saved.gradeScale), toPassMarkText(saved.passMark));
  return (
    JSON.stringify(current) !== JSON.stringify(original) ||
    // An unreadable field reads as the fallback above; any edit to it still counts.
    rows.some((r) => parsePercent(r.min) === null) ||
    parsePercent(passMark) === null
  );
}

/**
 * Whether the rows equal the default scale and pass mark.
 *
 * @param rows - The scale being edited.
 * @param passMark - The pass mark field's text.
 * @returns True when "Reset to default" would change nothing.
 */
export function isDefaultGrading(rows: readonly BandDraft[], passMark: string): boolean {
  return JSON.stringify(toGradingPayload(rows, passMark)) ===
    JSON.stringify(toGradingPayload(toBandDrafts(DEFAULT_GRADE_SCALE), String(DEFAULT_PASS_MARK)));
}

/** One band of the preview. */
export interface PreviewBand {
  id: string;
  letter: string;
  remark: string;
  /** Percent where the band starts (inclusive). */
  from: number;
  /** Percent where the next band starts (exclusive), or 100 for the top band. */
  to: number;
  /** "70% and above", "60% to under 70%". */
  range: string;
  /** Every score in the band is at or above the pass mark. */
  passes: boolean;
}

/**
 * The scale as bands on a 0–100 line, for the preview. Only drawn for a
 * scale that passes the checks; returns an empty list otherwise.
 *
 * @param rows - The scale, highest first.
 * @param passMark - The pass mark field's text.
 * @returns The bands, lowest first (the order they sit on the line).
 */
export function previewGrading(rows: readonly BandDraft[], passMark: string): PreviewBand[] {
  const errors = validateGrading(rows, passMark);
  if (errors.scale || Object.values(errors.bands).some((e) => e.min || e.letter)) return [];
  const pass = parsePercent(passMark) ?? DEFAULT_PASS_MARK;
  const bands = rows.map((row, index) => {
    const from = parsePercent(row.min) ?? 0;
    const to = index === 0 ? 100 : (parsePercent(rows[index - 1].min) ?? 100);
    return {
      id: row.id,
      letter: row.letter.trim(),
      remark: row.remark.trim(),
      from,
      to,
      range: index === 0 ? `${from}% and above` : `${from}% to under ${to}%`,
      passes: from >= pass,
    };
  });
  return bands.reverse();
}

/**
 * The grade whose range holds the pass mark without starting at it, i.e. a
 * grade some of whose scores pass and some fail.
 *
 * @param bands - From {@link previewGrading}.
 * @param passMark - The pass mark field's text.
 * @returns That band, or null when the pass mark sits on a grade boundary.
 */
export function bandSplitByPassMark(bands: readonly PreviewBand[], passMark: string): PreviewBand | null {
  const pass = parsePercent(passMark);
  if (pass === null) return null;
  return bands.find((b) => b.from < pass && pass < b.to) ?? null;
}

/**
 * Maps `VALIDATION_FAILED` details (`gradeScale.2.min`, `gradeScale`,
 * `passMark`) onto the rows and fields.
 *
 * @param rows - The rows that were sent, in order.
 * @param fieldErrors - `ApiError.fieldErrors()`.
 * @returns The messages to show.
 */
export function mapServerGradingErrors(
  rows: readonly BandDraft[],
  fieldErrors: Record<string, string>
): GradingErrors {
  const errors: GradingErrors = { bands: {} };
  for (const [field, message] of Object.entries(fieldErrors)) {
    const match = /^gradeScale\.(\d+)\.(letter|min|remark)$/.exec(field);
    if (match) {
      const row = rows[Number(match[1])];
      if (row) errors.bands[row.id] = { ...errors.bands[row.id], [match[2]]: message };
    } else if (field === "gradeScale" || field.startsWith("gradeScale.")) {
      errors.scale = message;
    } else if (field === "passMark") {
      errors.passMark = message;
    }
  }
  return errors;
}
