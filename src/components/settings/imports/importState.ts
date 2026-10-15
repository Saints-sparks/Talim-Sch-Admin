/**
 * The past-records import page's state machine and wording, kept free of
 * React so it can be tested on its own.
 *
 *   pick a file → uploading → validating → invalid | valid
 *   valid → (Import) → committing → done | failed
 *   failed → (Try again) → committing
 *
 * `validating` and `committing` are polled; the other states are final until
 * the admin acts.
 */
import {
  MAX_IMPORT_FILE_BYTES,
  type ImportJobStatus,
  type ImportJobSummary,
  type ImportProgress,
} from "@/app/services/imports.service";
import type { Tone } from "@/components/tl";

/** What the page shows: no import open, an upload running, or an import's status. */
export type ImportStage = "idle" | "uploading" | ImportJobStatus;

/** How often a running import is re-read, in milliseconds. */
export const IMPORT_POLL_MS = 2000;

/** The file kinds the importer reads. */
export const IMPORT_FILE_EXTENSIONS = [".xlsx", ".zip", ".csv"] as const;

/** The `accept` attribute of the file picker. */
export const IMPORT_FILE_ACCEPT = [
  ...IMPORT_FILE_EXTENSIONS,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "text/csv",
].join(",");

/**
 * Where the page stands.
 *
 * @param uploading - True while the file is being sent.
 * @param status - The open import's status, if one is open.
 * @returns The stage.
 */
export function importStage(uploading: boolean, status?: ImportJobStatus | null): ImportStage {
  if (uploading) return "uploading";
  return status ?? "idle";
}

/**
 * Whether an import is still moving on the server and must be polled.
 *
 * @param status - The import's status.
 * @returns True for `validating` and `committing`.
 */
export function isImportRunning(status?: ImportJobStatus | null): boolean {
  return status === "validating" || status === "committing";
}

/**
 * Whether "Import" (or "Try again") may be pressed.
 *
 * @param status - The import's status.
 * @returns True for `valid` and `failed`.
 */
export function canCommitImport(status?: ImportJobStatus | null): boolean {
  return status === "valid" || status === "failed";
}

/**
 * Checks a picked file before it is sent: the kind and the 50 MB limit.
 *
 * @param file - The file's name and size.
 * @param file.name - Its name.
 * @param file.size - Its size in bytes.
 * @returns A sentence for the admin, or `null` when it may be uploaded.
 */
export function importFileProblem(file: { name: string; size: number }): string | null {
  const name = file.name.toLowerCase();
  if (!IMPORT_FILE_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return "Choose an Excel workbook (.xlsx), a ZIP of CSV files (.zip) or a CSV file (.csv).";
  }
  if (file.size > MAX_IMPORT_FILE_BYTES)
    return "The file is larger than 50 MB. Split it into smaller files.";
  if (file.size === 0) return "The file is empty.";
  return null;
}

/** Labels and badge tones per status. */
export const IMPORT_STATUS: Record<ImportJobStatus, { label: string; tone: Tone }> = {
  validating: { label: "Checking", tone: "info" },
  invalid: { label: "Needs fixing", tone: "danger" },
  valid: { label: "Ready to import", tone: "accent" },
  committing: { label: "Importing", tone: "info" },
  done: { label: "Imported", tone: "success" },
  failed: { label: "Stopped", tone: "warning" },
};

/** The pack's sheets in workbook order, keyed as `counts` keys them. */
export const IMPORT_SHEETS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "sessions", label: "Sessions" },
  { key: "terms", label: "Terms" },
  { key: "classes", label: "Classes" },
  { key: "subjects", label: "Subjects" },
  { key: "teachers", label: "Teachers" },
  { key: "classSubjects", label: "ClassSubjects" },
  { key: "students", label: "Students" },
  { key: "enrollments", label: "Enrollments" },
  { key: "assessments", label: "Assessments" },
  { key: "scores", label: "Scores" },
  { key: "termResults", label: "TermResults" },
];

/**
 * The rows per sheet in workbook order, then any sheet this list does not
 * know, so nothing the server counted is hidden.
 *
 * @param counts - `counts` from the import.
 * @returns Label and count pairs.
 */
export function sheetCounts(
  counts: Record<string, number> | undefined
): Array<{ label: string; count: number }> {
  const all = counts ?? {};
  const known = IMPORT_SHEETS.filter((s) => s.key in all).map((s) => ({
    label: s.label,
    count: all[s.key],
  }));
  const knownKeys = new Set(IMPORT_SHEETS.map((s) => s.key));
  const extra = Object.entries(all)
    .filter(([key]) => !knownKeys.has(key))
    .map(([label, count]) => ({ label, count }));
  return [...known, ...extra];
}

/** Plain words for each phase the queue reports. */
const PHASES: Record<string, string> = {
  queued: "Waiting to start",
  reading: "Reading the file",
  validating: "Checking every row",
  validated: "Checked",
  sessions: "Sessions and terms",
  classes: "Classes and subjects",
  teachers: "Teachers",
  courses: "Class subjects",
  students: "Students and parents",
  enrollments: "Class history",
  results: "Scores and results",
  done: "Finished",
};

/**
 * The phase in plain words.
 *
 * @param phase - The queue's phase.
 * @returns The label (the raw phase when unknown).
 */
export function phaseLabel(phase: string | undefined): string {
  if (!phase) return PHASES.queued;
  return PHASES[phase] ?? phase.charAt(0).toUpperCase() + phase.slice(1);
}

/**
 * Progress as a whole percentage, clamped to 0–100.
 *
 * @param progress - The queue's progress.
 * @returns The percentage, or `null` while the total is unknown.
 */
export function progressPercent(progress: ImportProgress | undefined): number | null {
  if (!progress || !progress.total || progress.total <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((progress.done / progress.total) * 100)));
}

/** Collection names in plain words, for the "what was written" summary. */
const COLLECTIONS: Record<string, string> = {
  academicYears: "Sessions",
  terms: "Terms",
  classes: "Classes",
  subjects: "Subjects",
  courses: "Class subjects",
  users: "Accounts",
  teachers: "Teachers",
  students: "Students",
  parents: "Parents",
  studentEnrollments: "Class history",
  enrollments: "Class history",
  assessments: "Assessments",
  assessmentGradeRecords: "Scores",
  assessmentGradePublications: "Published scores",
  courseGradeRecords: "Subject totals",
  studentCumulativeTermGradeRecords: "Term results",
  classCumulativeTermGradeRecords: "Class term results",
  term_result_submissions: "Result submissions",
  termResultSubmissions: "Result submissions",
  term_remarks: "Remarks",
  termRemarks: "Remarks",
};

/**
 * A collection in plain words.
 *
 * @param key - The collection as the result names it.
 * @returns The label (the key itself when unknown).
 */
export function collectionLabel(key: string): string {
  return COLLECTIONS[key] ?? key;
}

/**
 * A file size in KB or MB.
 *
 * @param bytes - The size.
 * @returns e.g. "4.7 MB".
 */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Where an issue is, in the words a spreadsheet user reads.
 *
 * @param issue - The issue's sheet and row.
 * @param issue.sheet - Sheet name (`""` for the file).
 * @param issue.row - Row number (0 for the whole sheet).
 * @returns e.g. "Row 14", "Whole sheet" or "File".
 */
export function issueRowLabel(issue: { sheet: string; row: number }): string {
  if (!issue.sheet) return "File";
  return issue.row > 0 ? String(issue.row) : "Whole sheet";
}

/**
 * Whether an import's summary is newer news than the list shows: used to keep
 * the "past imports" list fresh while one import is polled.
 *
 * @param job - The import.
 * @returns True once it has stopped moving.
 */
export function isImportSettled(job: Pick<ImportJobSummary, "status">): boolean {
  return !isImportRunning(job.status);
}
