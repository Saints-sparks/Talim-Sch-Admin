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
import type { AcademicGradingFields, GradeBand } from "@/types/gradingContract";
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
/** Fields `PATCH /settings/academic` accepts (the backend DTO). */
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

/** Receipt appearance and parent-facing options. */
export interface ReceiptSettings {
  schoolId: string;
  signatureUrl: string;
  signatureName: string;
  signatureTitle: string;
  showSchoolLogo: boolean;
  allowParentDownload: boolean;
  showQrVerification: boolean;
  showAuthorizedSignature: boolean;
  footerNote: string;
}

/** Withdrawal safeguards for the school wallet. */
export interface FinanceSettings {
  schoolId: string;
  requireEmailOtpForWithdrawals: boolean;
  minimumWithdrawalAmount: number;
  defaultBankAccountId: string | null;
}

/** A weekday the school may teach on. */
export type SchoolWeekday = Schema<"AcademicSettingsDto">["schoolDays"][number];

/** One slot of the school day: a lesson period or a break. */
export type SchoolPeriod = Schema<"AcademicPeriodResponseDto">;

/**
 * The school's clock, bell schedule, grade scale and pass mark. The API fills
 * in defaults (`Africa/Lagos`, Monday–Friday, 11:00 / 16:00, no periods; the
 * A–F scale and a pass mark of 50), so every field is always present. The
 * grading fields (Round 3, §16) are hand-written in `gradingContract.ts`
 * until the generated contract has them.
 */
export type AcademicSettings = Schema<"AcademicSettingsDto"> & AcademicGradingFields;

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
 * Loads the receipt settings, creating the defaults server-side on first read.
 *
 * @returns The receipt settings.
 * @throws `ApiError` when the request fails.
 */
export const getReceiptSettings = async (): Promise<{ success: boolean; settings: ReceiptSettings }> =>
  api.get<{ success: boolean; settings: ReceiptSettings }>(`${BASE}/receipt`);

/**
 * Saves receipt settings.
 *
 * @param dto - Only the fields being changed.
 * @returns The saved receipt settings.
 * @throws `ApiError` — `VALIDATION_FAILED` when a field breaks the DTO rules.
 */
export const updateReceiptSettings = async (
  dto: UpdateReceiptSettingsDto
): Promise<{ success: boolean; settings: ReceiptSettings }> =>
  api.patch<{ success: boolean; settings: ReceiptSettings }>(`${BASE}/receipt`, dto);

// ─── Finance Settings ─────────────────────────────────────────────────────────

/**
 * Loads the withdrawal safeguards for this school.
 *
 * @returns The finance settings.
 * @throws `ApiError` when the request fails.
 */
export const getFinanceSettings = async (): Promise<{ success: boolean; settings: FinanceSettings }> =>
  api.get<{ success: boolean; settings: FinanceSettings }>(`${BASE}/finance`);

/**
 * Saves the withdrawal safeguards.
 *
 * @param dto - Only the fields being changed.
 * @returns The saved finance settings.
 * @throws `ApiError` — `VALIDATION_FAILED` when a field breaks the DTO rules.
 */
export const updateFinanceSettings = async (
  dto: UpdateFinanceSettingsDto
): Promise<{ success: boolean; settings: FinanceSettings }> =>
  api.patch<{ success: boolean; settings: FinanceSettings }>(`${BASE}/finance`, dto);

// ─── Academic Settings ────────────────────────────────────────────────────────

/**
 * Loads the timezone, school days, register times and bell schedule. Open to
 * every school admin and sub-admin (no permission needed to read).
 *
 * @returns The academic settings with defaults filled in.
 * @throws `ApiError` when the request fails.
 */
export const getAcademicSettings = async (): Promise<{ success: boolean; settings: AcademicSettings }> =>
  api.get<{ success: boolean; settings: AcademicSettings }>(`${BASE}/academic`);

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
): Promise<{ success: boolean; settings: AcademicSettings }> =>
  api.patch<{ success: boolean; settings: AcademicSettings }>(`${BASE}/academic`, dto);

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
