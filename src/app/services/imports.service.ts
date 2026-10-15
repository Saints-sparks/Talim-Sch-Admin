/**
 * Past-records import (`/imports/history`, contract
 * `talimBE-V2/docs/history-records-and-transcripts.md` §3): the template, the
 * upload, the validation report, the commit and the errors CSV.
 *
 * School admins only: the API answers 403 to every other role. The school is
 * taken from the bearer token; nothing here passes a school id.
 *
 * Types come from the generated contract (`npm run types:api`). Two fields
 * are typed `Record<string, never>` there because the DTOs declare them as
 * free-form maps (`counts`, `result`); they are narrowed here to what the
 * importer writes.
 */
import { api } from "@/lib/apiClient";
import { fetchFile, type DownloadedFile } from "@/lib/download";
import type { Schema } from "@/types/apiContract";

/** Where an import stands (`ImportJobStatus`). */
export type ImportJobStatus = Schema<"ImportJobSummaryDto">["status"];

/** One problem in a pack: sheet (`""` for the file), row (0 for a whole sheet), column, message. */
export type ImportIssue = Schema<"ImportIssueDto">;

/** A page of issues, 100 per page, the first 1,000 kept. */
export type ImportIssuePage = Schema<"ImportIssuePageDto">;

/** How far the queue has got: `phase`, `done`, `total`. */
export type ImportProgress = Schema<"ImportProgressDto">;

/** What was written to one collection. */
export interface ImportCollectionResult {
  created: number;
  updated: number;
  deleted?: number;
}

/** An import in the list, with `counts` as data rows per sheet. */
export type ImportJobSummary = Omit<Schema<"ImportJobSummaryDto">, "counts"> & {
  counts: Record<string, number>;
};

/** One import with its report and, once done, what was written per collection. */
export type ImportJob = Omit<Schema<"ImportJobDto">, "counts" | "result"> & {
  counts: Record<string, number>;
  result?: Record<string, ImportCollectionResult> | null;
};

/** A page of imports. */
export type ImportJobList = Omit<Schema<"ImportJobListDto">, "items"> & {
  items: ImportJobSummary[];
};

/** The answer to an upload or a commit: the id and `validating` or `committing`. */
export type ImportJobAccepted = Schema<"ImportJobAcceptedDto">;

/** The largest file the API accepts (`MAX_IMPORT_FILE_BYTES`). */
export const MAX_IMPORT_FILE_BYTES = 50 * 1024 * 1024;

/** Issues per page of the report (`ISSUES_PAGE_SIZE`). */
export const IMPORT_ISSUES_PAGE_SIZE = 100;

const BASE = "/imports/history";

/**
 * The XLSX template: an Instructions sheet, one sheet per pack sheet with its
 * headers, and an Examples sheet.
 *
 * @returns The workbook and its file name.
 * @throws `ApiError` — `FORBIDDEN` for anyone but a school admin.
 */
export function downloadImportTemplate(): Promise<DownloadedFile> {
  return fetchFile(`${BASE}/template`, "talim-past-records-template.xlsx");
}

/**
 * Uploads a pack (an .xlsx workbook or a ZIP of CSV files, 50 MB at most) and
 * queues its check.
 *
 * @param file - The pack.
 * @returns The new import's id and `validating`.
 * @throws `ApiError` — 400 with `meta.code` `IMPORT_FILE_TYPE` or `IMPORT_FILE_TOO_LARGE`.
 */
export function uploadImport(file: File): Promise<ImportJobAccepted> {
  const form = new FormData();
  form.append("file", file);
  // A 50 MB upload on a slow line takes minutes, not the default 30 s.
  return api.post<ImportJobAccepted>(BASE, form, { timeoutMs: 15 * 60_000 });
}

/**
 * The school's imports, newest first.
 *
 * @param page - 1-based page.
 * @param limit - Page size (the API caps it at 100).
 * @returns The page.
 */
export function listImports(page = 1, limit = 20): Promise<ImportJobList> {
  const query = new URLSearchParams({ page: String(page), limit: String(Math.min(limit, 100)) });
  return api.get<ImportJobList>(`${BASE}?${query}`);
}

/**
 * One import with its validation report.
 *
 * @param id - The import.
 * @param errorsPage - Page of errors (100 per page).
 * @param warningsPage - Page of warnings (100 per page).
 * @returns The import.
 * @throws `ApiError` — `NOT_FOUND` for another school's import.
 */
export function getImport(id: string, errorsPage = 1, warningsPage = 1): Promise<ImportJob> {
  const query = new URLSearchParams({
    errorsPage: String(errorsPage),
    warningsPage: String(warningsPage),
  });
  return api.get<ImportJob>(`${BASE}/${encodeURIComponent(id)}?${query}`);
}

/**
 * Queues the write of a valid import, or resumes a failed one (every phase
 * is idempotent).
 *
 * @param id - The import.
 * @returns The id and `committing`.
 * @throws `ApiError` — 409 with `meta.code` `IMPORT_NOT_VALID` (and
 *   `meta.importStatus`) or `IMPORT_IN_PROGRESS`.
 */
export function commitImport(id: string): Promise<ImportJobAccepted> {
  return api.post<ImportJobAccepted>(`${BASE}/${encodeURIComponent(id)}/commit`);
}

/**
 * Every error of an import as CSV (`sheet,row,column,message`).
 *
 * @param id - The import.
 * @returns The CSV and its file name.
 */
export function downloadImportErrors(id: string): Promise<DownloadedFile> {
  return fetchFile(`${BASE}/${encodeURIComponent(id)}/errors.csv`, "import-errors.csv");
}
