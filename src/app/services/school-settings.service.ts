/**
 * School Settings API (`/settings`).
 *
 * Every call goes through the typed `api` facade, so a failure arrives as an
 * `ApiError` with a stable `code`, a user-safe `message` and field details —
 * the settings sections branch on those rather than on raw responses.
 *
 * The school is taken from the bearer token by the backend; nothing here
 * passes a school id.
 */
import { api } from "@/lib/apiClient";
import type { Schema } from "@/types/apiContract";
import type { GradeBand } from "@/types/gradingContract";
import type { OfficeHours } from "@/types/round4Contract";
import type {
  UpdateAcademicSettingsPayload,
  UpdateFinanceSettingsPayload,
  UpdateReceiptSettingsPayload,
  UpdateSchoolProfilePayload,
} from "@/types/apiPayloads";

/** Fields `PATCH /settings/school-profile` accepts (the backend DTO). */
export type UpdateSchoolProfileDto = UpdateSchoolProfilePayload;
/** Fields `PATCH /settings/receipt` accepts (the backend DTO). */
export type UpdateReceiptSettingsDto = UpdateReceiptSettingsPayload;
/** Fields `PATCH /settings/finance` accepts (the backend DTO). */
export type UpdateFinanceSettingsDto = UpdateFinanceSettingsPayload;
/**
 * Fields `PATCH /settings/academic` accepts (the backend DTO), Round 4 §36
 * `officeHours` included (`null` clears them).
 */
export type UpdateAcademicSettingsDto = UpdateAcademicSettingsPayload;

const BASE = "/settings";

// ─── Types ────────────────────────────────────────────────────────────────────

/** One named contact person for the school, as stored on the school document. */
export interface PrimaryContact {
  name: string;
  phone: string;
  email: string;
  role: string;
}

/** The school record shown in Settings → School Profile. */
export interface SchoolProfile {
  _id: string;
  name: string;
  email: string;
  physicalAddress: string;
  schoolPrefix: string;
  active: boolean;
  logo: string;
  location?: { country: string; state: string };
  primaryContacts?: PrimaryContact[];
}

/** Receipt appearance and parent-facing options (`ReceiptSettingsDto`, owned by settings). */
export type ReceiptSettings = Schema<"ReceiptSettingsDto">;

/** Body of `GET` and `PATCH /settings/receipt`. */
export type ReceiptSettingsResponse = Schema<"ReceiptSettingsResponseDto">;

/**
 * Withdrawal safeguards for the school wallet, and the part-payment minimum:
 * `minimumPartPayment` is the smallest part payment a parent may make, in
 * naira (0: no minimum; the API fills in 0). A payment of the whole balance
 * is always allowed.
 */
export type FinanceSettings = Schema<"FinanceSettingsDto">;

/** Body of `GET` and `PATCH /settings/finance`. */
export type FinanceSettingsResponse = Schema<"FinanceSettingsResponseDto">;

/** A weekday the school may teach on. */
export type SchoolWeekday = Schema<"AcademicSettingsDto">["schoolDays"][number];

/** One slot of the school day: a lesson period or a break. */
export type SchoolPeriod = Schema<"AcademicPeriodResponseDto">;

/**
 * The school's clock, bell schedule, grade scale, pass mark and (Round 4 §36)
 * office hours. The API fills in defaults (`Africa/Lagos`, Monday–Friday,
 * 11:00 / 16:00, no periods; the A–F scale and a pass mark of 50), so every
 * field is present; `officeHours` is null until the school sets them.
 */
export type AcademicSettings = Schema<"AcademicSettingsDto">;

export type { OfficeHours };

/** Body of `GET` and `PATCH /settings/academic`. */
export type AcademicSettingsResponse = Schema<"AcademicSettingsResponseDto">;

/** One band of the school's grade scale. */
export type { GradeBand };

/** The datasets Settings → Data & System can export. */
export type ExportType = "students" | "staff" | "fees";

/** One CSV row: every column is already stringified by the backend. */
export type ExportRow = Record<string, string>;

/** Body of `GET /settings/data/export/:type`. */
export interface ExportResult {
  success: boolean;
  type: string;
  data: ExportRow[];
  count: number;
  /** Present when the dataset is empty by design (e.g. fees). */
  message?: string;
}

// ─── School Profile ───────────────────────────────────────────────────────────

/**
 * Loads the school record behind Settings → School Profile.
 *
 * @returns The school profile.
 * @throws `ApiError` when the request fails.
 */
export const getSchoolProfile = async (): Promise<{ success: boolean; school: SchoolProfile }> =>
  api.get<{ success: boolean; school: SchoolProfile }>(`${BASE}/school-profile`);

/**
 * Updates the editable parts of the school profile.
 *
 * @param dto - Only the fields being changed.
 * @returns The saved school profile.
 * @throws `ApiError` — `VALIDATION_FAILED` when a field breaks the DTO rules.
 */
export const updateSchoolProfile = async (
  dto: UpdateSchoolProfileDto
): Promise<{ success: boolean; school: SchoolProfile }> =>
  api.patch<{ success: boolean; school: SchoolProfile }>(`${BASE}/school-profile`, dto);

// ─── Receipt Settings ─────────────────────────────────────────────────────────

/**
 * Loads the receipt settings (the defaults when none are saved). Readable with
 * `manage:settings` or `manage:fees`.
 *
 * @returns `{ success, settings }`.
 * @throws `ApiError` when the request fails.
 */
export const getReceiptSettings = async (): Promise<ReceiptSettingsResponse> =>
  api.get<ReceiptSettingsResponse>(`${BASE}/receipt`);

/**
 * Saves receipt settings. Needs `manage:settings`.
 *
 * @param dto - Only the fields being changed.
 * @returns `{ success, settings }` with the saved settings.
 * @throws `ApiError` — `VALIDATION_FAILED` when a field breaks the DTO rules.
 */
export const updateReceiptSettings = async (
  dto: UpdateReceiptSettingsDto
): Promise<ReceiptSettingsResponse> => api.patch<ReceiptSettingsResponse>(`${BASE}/receipt`, dto);

// ─── Finance Settings ─────────────────────────────────────────────────────────

/**
 * Loads the withdrawal safeguards for this school.
 *
 * @returns The finance settings.
 * @throws `ApiError` when the request fails.
 */
export const getFinanceSettings = async (): Promise<FinanceSettingsResponse> =>
  api.get<FinanceSettingsResponse>(`${BASE}/finance`);

/**
 * Saves the withdrawal safeguards.
 *
 * @param dto - Only the fields being changed.
 * @returns The saved finance settings.
 * @throws `ApiError` — `VALIDATION_FAILED` when a field breaks the DTO rules.
 */
export const updateFinanceSettings = async (
  dto: UpdateFinanceSettingsDto
): Promise<FinanceSettingsResponse> =>
  api.patch<FinanceSettingsResponse>(`${BASE}/finance`, dto);

// ─── Academic Settings ────────────────────────────────────────────────────────

/**
 * Loads the timezone, school days, register times and bell schedule. Open to
 * every school admin and sub-admin (no permission needed to read).
 *
 * @returns The academic settings with defaults filled in.
 * @throws `ApiError` when the request fails.
 */
export const getAcademicSettings = async (): Promise<AcademicSettingsResponse> =>
  api.get<AcademicSettingsResponse>(`${BASE}/academic`);

/**
 * Saves academic settings. `periods`, when sent, replaces the whole list; the
 * API sorts it by start time and rejects duplicate keys and overlaps.
 * `gradeScale`, when sent, replaces the scale; the API rejects duplicate
 * letters, minimums that do not strictly descend, and a last minimum above 0.
 *
 * @param dto - Only the fields being changed.
 * @returns The saved settings.
 * @throws `ApiError` — `VALIDATION_FAILED` (with `periods.N.field` or
 *   `gradeScale.N.field` details) when a field breaks the DTO rules,
 *   `FORBIDDEN` for a sub-admin without `manage:settings`.
 */
export const updateAcademicSettings = async (
  dto: UpdateAcademicSettingsDto
): Promise<AcademicSettingsResponse> =>
  api.patch<AcademicSettingsResponse>(`${BASE}/academic`, dto);

// ─── Data Export ──────────────────────────────────────────────────────────────

/**
 * Fetches one export dataset as rows ready for CSV.
 *
 * @param type - Which dataset to export.
 * @returns The rows, their count, and a `message` when the dataset is empty by design.
 * @throws `ApiError` when the request fails.
 */
export const fetchExportData = async (type: ExportType): Promise<ExportResult> =>
  api.get<ExportResult>(`${BASE}/data/export/${type}`);

/**
 * Turns export rows into a CSV file and saves it in the browser.
 *
 * @param rows - Rows to write; the first row's keys become the header.
 * @param filename - Name to save the file under.
 */
export const downloadAsCsv = (rows: ExportRow[], filename: string): void => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
  ];
  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
