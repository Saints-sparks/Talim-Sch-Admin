/**
 * Fees API — categories, fee items, class assignments, receipt settings and the
 * fees dashboard summary.
 *
 * Every request payload is the backend DTO itself, generated into
 * `src/types/apiPayloads.ts` from `talimBE-V2` (`npm run types:api`). The API validates with
 * `whitelist: true, forbidNonWhitelisted: true`, so an unknown property is a
 * 400 rather than a silently ignored field — that is why the update payloads
 * are explicit types and not `Partial<FeeItem>`.
 *
 * The school is taken from the bearer token by the API; no call sends a
 * school id. Every function throws `ApiError` on a non-2xx response.
 */
import { api } from "@/lib/apiClient";
import type {
  AssignFeePayload,
  CreateFeeCategoryPayload,
  CreateFeeItemPayload,
  UpdateFeeAssignmentPayload,
  UpdateFeeCategoryPayload,
  UpdateFeeItemPayload,
  UpdateFeeReceiptSettingsPayload,
} from "@/types/apiPayloads";

// Request payloads come straight from the backend contract, so `tsc` fails when
// a DTO changes; re-exported here for the callers that already import them.
export type {
  AssignFeePayload,
  ClassAssignmentOverride,
  CreateFeeCategoryPayload,
  CreateFeeItemPayload,
  UpdateFeeAssignmentPayload,
  UpdateFeeCategoryPayload,
  UpdateFeeItemPayload,
} from "@/types/apiPayloads";

const BASE = "/fees";

// ─── Types ────────────────────────────────────────────────────────────────────

/** A Mongo reference the API returns either as a bare id or a populated object. */
export type Ref<T> = string | T;

/** Lifecycle of a fee category (`CategoryStatus` on the backend). */
export type FeeCategoryStatus = "active" | "archived";

/** Lifecycle of a fee item (`FeeStatus` on the backend). */
export type FeeItemStatus = "draft" | "active" | "inactive" | "archived";

/** Lifecycle of a class assignment (`AssignmentStatus` on the backend). */
export type FeeAssignmentStatus = "draft" | "active" | "inactive" | "archived";

/** How often a fee falls due (`FeeType` on the backend). */
export type FeeType = "one_time" | "recurring" | "termly" | "annual";

/** State of a payment against an assignment (`PaymentStatus` on the backend). */
export type FeePaymentStatus = "pending" | "successful" | "failed" | "refunded" | "partial";

/** A named grouping of fee items, e.g. "Tuition". */
export interface FeeCategory {
  _id: string;
  name: string;
  description: string;
  status: FeeCategoryStatus;
  createdAt: string;
  updatedAt: string;
  /** Only present on `getCategoriesSummary()`. */
  feeCount?: number;
}

/** A fee the school can charge, before it is assigned to any class. */
export interface FeeItem {
  _id: string;
  name: string;
  categoryId: Ref<{ _id: string; name: string }>;
  description: string;
  academicYearId?: Ref<{ _id: string; name: string }>;
  termId?: Ref<{ _id: string; name: string }>;
  feeType: FeeType;
  defaultAmount: number;
  defaultDueDate?: string;
  lateFeeAmount: number;
  allowPartialPayment: boolean;
  isVisibleToParents: boolean;
  includeInCollection: boolean;
  status: FeeItemStatus;
  createdAt: string;
  updatedAt: string;
}

/** A fee item attached to one class, with that class's amount and due date. */
export interface FeeAssignment {
  _id: string;
  feeItemId: Ref<{ _id: string; name: string; feeType: FeeType }>;
  classId: Ref<{ _id: string; name: string; gradeLevel: string }>;
  academicYearId?: Ref<{ _id: string; name: string }>;
  termId?: Ref<{ _id: string; name: string }>;
  amount: number;
  dueDate: string;
  lateFeeAmount: number;
  isVisibleToParents: boolean;
  status: FeeAssignmentStatus;
  createdAt: string;
  updatedAt: string;
}

/** What `POST /fees/assignments` returns. */
export interface AssignFeeResult {
  assigned: number;
  skipped: number;
  assignments: FeeAssignment[];
}

/** A recorded payment against an assignment. */
export interface FeePayment {
  _id: string;
  studentId: Ref<{ _id: string; firstName: string; lastName: string }>;
  feeAssignmentId: string;
  amountExpected: number;
  amountPaid: number;
  balance: number;
  paymentMethod: string;
  paymentStatus: FeePaymentStatus;
  receiptNumber: string;
  transactionReference: string;
  paidAt: string;
  createdAt: string;
}

/** Signature and visibility settings printed on fee receipts. */
export interface ReceiptSettings {
  schoolId?: string;
  signatureUrl: string;
  signatureName: string;
  signatureTitle: string;
  showSchoolLogo: boolean;
  allowParentDownload: boolean;
}

/** Money and counters for the fees dashboard. Changes with every payment. */
export interface DashboardSummary {
  totalFeeItems: number;
  activeFeeItems: number;
  totalExpectedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  feeCategories: number;
  activeAssignments: number;
}

/** Query for `GET /fees/items` (`FeeItemQueryDto`). `limit` is capped at 100. */
export interface FeeItemQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  academicYearId?: string;
  status?: FeeItemStatus;
  includeArchived?: boolean;
}

/** Query for `GET /fees/assignments` (`FeeAssignmentQueryDto`). */
export interface FeeAssignmentQuery {
  page?: number;
  limit?: number;
  classId?: string;
  feeItemId?: string;
  academicYearId?: string;
  status?: FeeAssignmentStatus;
  includeArchived?: boolean;
}

/** A page of a fee list, as the fee repositories return it. */
export interface FeePage<T> {
  data: T[];
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds a query string, dropping `undefined`, `null` and empty values so an
 * unset filter is never sent as `status=` (which the API rejects as an
 * invalid enum).
 *
 * @param params - Raw query values.
 * @returns A string starting with `?`, or `""` when nothing is set.
 */
function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

// ─── Category APIs ────────────────────────────────────────────────────────────

/**
 * Creates a fee category.
 *
 * @param payload - Name and optional description.
 * @returns The created category.
 * @throws ApiError - `CONFLICT` when the name is already used.
 */
export async function createFeeCategory(payload: CreateFeeCategoryPayload): Promise<FeeCategory> {
  return api.post<FeeCategory>(`${BASE}/categories`, payload);
}

/**
 * Lists the school's fee categories.
 *
 * @param includeArchived - Include archived categories. Defaults to `false`.
 * @returns Every matching category.
 * @throws ApiError - On any non-2xx response.
 */
export async function getFeeCategories(includeArchived = false): Promise<FeeCategory[]> {
  return api.get<FeeCategory[]>(`${BASE}/categories?includeArchived=${includeArchived}`);
}

/**
 * Renames a category, edits its description or changes its status.
 *
 * @param id - Category id.
 * @param payload - The fields to change.
 * @returns The updated category.
 * @throws ApiError - `NOT_FOUND` when the category is not this school's.
 */
export async function updateFeeCategory(
  id: string,
  payload: UpdateFeeCategoryPayload
): Promise<FeeCategory> {
  return api.patch<FeeCategory>(`${BASE}/categories/${id}`, payload);
}

/**
 * Archives a category so it stops appearing in the pickers.
 *
 * @param id - Category id.
 * @returns The archived category.
 * @throws ApiError - On any non-2xx response.
 */
export async function archiveFeeCategory(id: string): Promise<FeeCategory> {
  return api.patch<FeeCategory>(`${BASE}/categories/${id}/archive`);
}

/**
 * Restores an archived category.
 *
 * @param id - Category id.
 * @returns The restored category.
 * @throws ApiError - On any non-2xx response.
 */
export async function restoreFeeCategory(id: string): Promise<FeeCategory> {
  return api.patch<FeeCategory>(`${BASE}/categories/${id}/restore`);
}

// ─── Fee Item APIs ────────────────────────────────────────────────────────────

/**
 * Creates a fee item.
 *
 * @param payload - The fee, matching `CreateFeeItemDto`.
 * @returns The created fee item.
 * @throws ApiError - `VALIDATION_FAILED` with field details when the payload
 *   does not match the DTO; `NOT_FOUND` when the category does not exist.
 */
export async function createFeeItem(payload: CreateFeeItemPayload): Promise<FeeItem> {
  return api.post<FeeItem>(`${BASE}/items`, payload);
}

/**
 * Lists fee items, newest first, paginated by the server.
 *
 * @param params - Paging, search and filters. `limit` is capped at 100.
 * @returns The page of items and the total matching count.
 * @throws ApiError - On any non-2xx response.
 */
export async function getFeeItems(params: FeeItemQuery = {}): Promise<FeePage<FeeItem>> {
  return api.get<FeePage<FeeItem>>(`${BASE}/items${toQueryString({ ...params })}`);
}

/**
 * Reads one fee item, with its category populated.
 *
 * @param id - Fee item id.
 * @returns The fee item.
 * @throws ApiError - `NOT_FOUND` when it is not this school's.
 */
export async function getFeeItemById(id: string): Promise<FeeItem> {
  return api.get<FeeItem>(`${BASE}/items/${id}`);
}

/**
 * Updates a fee item. Only DTO fields may be sent — passing a whole `FeeItem`
 * back (with `_id`, `createdAt`, a populated `categoryId`) is rejected by the
 * API's whitelist validation.
 *
 * @param id - Fee item id.
 * @param payload - The fields to change.
 * @returns The updated fee item.
 * @throws ApiError - On any non-2xx response.
 */
export async function updateFeeItem(id: string, payload: UpdateFeeItemPayload): Promise<FeeItem> {
  return api.patch<FeeItem>(`${BASE}/items/${id}`, payload);
}

/**
 * Moves a fee item between draft, active and inactive.
 *
 * @param id - Fee item id.
 * @param status - The status to set.
 * @returns The updated fee item.
 * @throws ApiError - On any non-2xx response.
 */
export async function updateFeeItemStatus(id: string, status: FeeItemStatus): Promise<FeeItem> {
  return updateFeeItem(id, { status });
}

/**
 * Copies a fee item as a draft named "… (Copy)".
 *
 * @param id - Fee item id to copy.
 * @returns The new fee item.
 * @throws ApiError - On any non-2xx response.
 */
export async function duplicateFeeItem(id: string): Promise<FeeItem> {
  return api.post<FeeItem>(`${BASE}/items/${id}/duplicate`);
}

/**
 * Archives a fee item.
 *
 * @param id - Fee item id.
 * @returns The archived fee item.
 * @throws ApiError - On any non-2xx response.
 */
export async function archiveFeeItem(id: string): Promise<FeeItem> {
  return api.patch<FeeItem>(`${BASE}/items/${id}/archive`);
}

/**
 * Restores an archived fee item.
 *
 * @param id - Fee item id.
 * @returns The restored fee item.
 * @throws ApiError - On any non-2xx response.
 */
export async function restoreFeeItem(id: string): Promise<FeeItem> {
  return api.patch<FeeItem>(`${BASE}/items/${id}/restore`);
}

// ─── Assignment APIs ──────────────────────────────────────────────────────────

/**
 * Assigns one fee item to one or more classes, each with its own amount and
 * due date. Classes that already carry the fee are skipped, not duplicated.
 *
 * @param payload - The fee item, optional year/term, and the class overrides.
 * @returns How many assignments were created, how many skipped, and the rows.
 * @throws ApiError - `VALIDATION_FAILED` when a class entry is incomplete.
 */
export async function assignFeeToClasses(payload: AssignFeePayload): Promise<AssignFeeResult> {
  return api.post<AssignFeeResult>(`${BASE}/assignments`, payload);
}

/**
 * Lists fee assignments, newest first, paginated by the server.
 *
 * @param params - Paging and filters.
 * @returns The page of assignments and the total matching count.
 * @throws ApiError - On any non-2xx response.
 */
export async function getFeeAssignments(
  params: FeeAssignmentQuery = {}
): Promise<FeePage<FeeAssignment>> {
  return api.get<FeePage<FeeAssignment>>(`${BASE}/assignments${toQueryString({ ...params })}`);
}

/**
 * Changes one class's amount, due date, late fee or visibility.
 *
 * @param id - Assignment id.
 * @param payload - The fields to change.
 * @returns The updated assignment.
 * @throws ApiError - On any non-2xx response.
 */
export async function updateFeeAssignment(
  id: string,
  payload: UpdateFeeAssignmentPayload
): Promise<FeeAssignment> {
  return api.patch<FeeAssignment>(`${BASE}/assignments/${id}`, payload);
}

/**
 * Publishes an assignment, making the fee payable by that class.
 *
 * @param id - Assignment id.
 * @returns The published assignment.
 * @throws ApiError - On any non-2xx response.
 */
export async function publishFeeAssignment(id: string): Promise<FeeAssignment> {
  return api.patch<FeeAssignment>(`${BASE}/assignments/${id}/publish`);
}

/**
 * Takes a published assignment back out of collection.
 *
 * @param id - Assignment id.
 * @returns The unpublished assignment.
 * @throws ApiError - On any non-2xx response.
 */
export async function unpublishFeeAssignment(id: string): Promise<FeeAssignment> {
  return api.patch<FeeAssignment>(`${BASE}/assignments/${id}/unpublish`);
}

/**
 * Archives an assignment.
 *
 * @param id - Assignment id.
 * @returns The archived assignment.
 * @throws ApiError - On any non-2xx response.
 */
export async function archiveFeeAssignment(id: string): Promise<FeeAssignment> {
  return api.patch<FeeAssignment>(`${BASE}/assignments/${id}/archive`);
}

/**
 * Restores an archived assignment.
 *
 * @param id - Assignment id.
 * @returns The restored assignment.
 * @throws ApiError - On any non-2xx response.
 */
export async function restoreFeeAssignment(id: string): Promise<FeeAssignment> {
  return api.patch<FeeAssignment>(`${BASE}/assignments/${id}/restore`);
}

// ─── Dashboard APIs ───────────────────────────────────────────────────────────

/**
 * Totals for the fees dashboard. Live money — recomputed on every read.
 *
 * @returns Counts and amounts for the signed-in school.
 * @throws ApiError - On any non-2xx response.
 */
export async function getFeesDashboardSummary(): Promise<DashboardSummary> {
  return api.get<DashboardSummary>(`${BASE}/dashboard/summary`);
}

/**
 * Categories with the number of fee items in each.
 *
 * @returns Every category, each carrying `feeCount`.
 * @throws ApiError - On any non-2xx response.
 */
export async function getCategoriesSummary(): Promise<FeeCategory[]> {
  return api.get<FeeCategory[]>(`${BASE}/dashboard/categories-summary`);
}

// ─── Receipt Settings APIs ────────────────────────────────────────────────────

/**
 * The school's receipt settings. The API returns defaults rather than 404
 * when the school has never saved any.
 *
 * @returns The settings.
 * @throws ApiError - On any non-2xx response.
 */
export async function getReceiptSettings(): Promise<ReceiptSettings> {
  return api.get<ReceiptSettings>(`${BASE}/receipt-settings`);
}

/**
 * Saves receipt settings.
 *
 * @param payload - The fields to change.
 * @returns The saved settings.
 * @throws ApiError - On any non-2xx response.
 */
export async function updateReceiptSettings(
  payload: UpdateFeeReceiptSettingsPayload
): Promise<ReceiptSettings> {
  return api.patch<ReceiptSettings>(`${BASE}/receipt-settings`, payload);
}

/**
 * Uploads a signature image for receipts. Saving the returned URL onto the
 * settings is a separate `updateReceiptSettings` call.
 *
 * @param file - An image file (the caller checks type and size first).
 * @returns The hosted URL of the uploaded image.
 * @throws ApiError - `PAYLOAD_TOO_LARGE` when the image is rejected.
 */
export async function uploadReceiptSignature(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return api.post<{ url: string }>("/upload/image", formData);
}
