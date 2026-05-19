import { apiClient } from "@/lib/apiClient";

const BASE = "/fees";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeeCategory {
  _id: string;
  name: string;
  description: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
  feeCount?: number;
}

export interface FeeItem {
  _id: string;
  name: string;
  categoryId: { _id: string; name: string } | string;
  description: string;
  academicYearId?: string;
  termId?: string;
  feeType: "one_time" | "recurring" | "termly" | "annual";
  defaultAmount: number;
  defaultDueDate?: string;
  lateFeeAmount: number;
  allowPartialPayment: boolean;
  isVisibleToParents: boolean;
  includeInCollection: boolean;
  status: "draft" | "active" | "inactive" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface FeeAssignment {
  _id: string;
  feeItemId: { _id: string; name: string; feeType: string } | string;
  classId: { _id: string; name: string; gradeLevel: string } | string;
  academicYearId?: { _id: string; name: string } | string;
  termId?: { _id: string; name: string } | string;
  amount: number;
  dueDate: string;
  lateFeeAmount: number;
  isVisibleToParents: boolean;
  status: "draft" | "active" | "inactive" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface ClassAssignmentOverride {
  classId: string;
  amount: number;
  dueDate: string;
  lateFeeAmount?: number;
  isVisibleToParents?: boolean;
}

export interface AssignFeePayload {
  feeItemId: string;
  academicYearId?: string;
  termId?: string;
  classes: ClassAssignmentOverride[];
}

export interface FeePayment {
  _id: string;
  studentId: { _id: string; firstName: string; lastName: string } | string;
  feeAssignmentId: string;
  amountExpected: number;
  amountPaid: number;
  balance: number;
  paymentMethod: string;
  paymentStatus: "pending" | "successful" | "failed" | "refunded" | "partial";
  receiptNumber: string;
  transactionReference: string;
  paidAt: string;
  createdAt: string;
}

export interface ReceiptSettings {
  schoolId?: string;
  signatureUrl: string;
  signatureName: string;
  signatureTitle: string;
  showSchoolLogo: boolean;
  allowParentDownload: boolean;
}

export interface DashboardSummary {
  totalFeeItems: number;
  activeFeeItems: number;
  totalExpectedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  feeCategories: number;
  activeAssignments: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data as T;
}

// ─── Category APIs ────────────────────────────────────────────────────────────

export async function createFeeCategory(payload: {
  name: string;
  description?: string;
}): Promise<FeeCategory> {
  const res = await apiClient.post(`${BASE}/categories`, payload);
  return handleResponse<FeeCategory>(res);
}

export async function getFeeCategories(
  includeArchived = false
): Promise<FeeCategory[]> {
  const res = await apiClient.get(
    `${BASE}/categories?includeArchived=${includeArchived}`
  );
  return handleResponse<FeeCategory[]>(res);
}

export async function updateFeeCategory(
  id: string,
  payload: Partial<{ name: string; description: string; status: string }>
): Promise<FeeCategory> {
  const res = await apiClient.patch(`${BASE}/categories/${id}`, payload);
  return handleResponse<FeeCategory>(res);
}

export async function archiveFeeCategory(id: string): Promise<FeeCategory> {
  const res = await apiClient.patch(`${BASE}/categories/${id}/archive`);
  return handleResponse<FeeCategory>(res);
}

export async function restoreFeeCategory(id: string): Promise<FeeCategory> {
  const res = await apiClient.patch(`${BASE}/categories/${id}/restore`);
  return handleResponse<FeeCategory>(res);
}

// ─── Fee Item APIs ────────────────────────────────────────────────────────────

export async function createFeeItem(payload: {
  name: string;
  categoryId: string;
  description?: string;
  academicYearId?: string;
  termId?: string;
  feeType: string;
  defaultAmount: number;
  defaultDueDate?: string;
  lateFeeAmount?: number;
  allowPartialPayment?: boolean;
  isVisibleToParents?: boolean;
  includeInCollection?: boolean;
}): Promise<FeeItem> {
  const res = await apiClient.post(`${BASE}/items`, payload);
  return handleResponse<FeeItem>(res);
}

export async function getFeeItems(params: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: string;
  includeArchived?: boolean;
} = {}): Promise<{ data: FeeItem[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) qs.set(k, String(v));
  });
  const res = await apiClient.get(`${BASE}/items?${qs.toString()}`);
  return handleResponse<{ data: FeeItem[]; total: number }>(res);
}

export async function getFeeItemById(id: string): Promise<FeeItem> {
  const res = await apiClient.get(`${BASE}/items/${id}`);
  return handleResponse<FeeItem>(res);
}

export async function updateFeeItem(
  id: string,
  payload: Partial<FeeItem>
): Promise<FeeItem> {
  const res = await apiClient.patch(`${BASE}/items/${id}`, payload);
  return handleResponse<FeeItem>(res);
}

export async function duplicateFeeItem(id: string): Promise<FeeItem> {
  const res = await apiClient.post(`${BASE}/items/${id}/duplicate`);
  return handleResponse<FeeItem>(res);
}

export async function archiveFeeItem(id: string): Promise<FeeItem> {
  const res = await apiClient.patch(`${BASE}/items/${id}/archive`);
  return handleResponse<FeeItem>(res);
}

export async function restoreFeeItem(id: string): Promise<FeeItem> {
  const res = await apiClient.patch(`${BASE}/items/${id}/restore`);
  return handleResponse<FeeItem>(res);
}

// ─── Assignment APIs ──────────────────────────────────────────────────────────

export async function assignFeeToClasses(
  payload: AssignFeePayload
): Promise<{ assigned: number; skipped: number; assignments: FeeAssignment[] }> {
  const res = await apiClient.post(`${BASE}/assignments`, payload);
  return handleResponse(res);
}

export async function getFeeAssignments(params: {
  page?: number;
  limit?: number;
  classId?: string;
  feeItemId?: string;
  status?: string;
  includeArchived?: boolean;
} = {}): Promise<{ data: FeeAssignment[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) qs.set(k, String(v));
  });
  const res = await apiClient.get(`${BASE}/assignments?${qs.toString()}`);
  return handleResponse<{ data: FeeAssignment[]; total: number }>(res);
}

export async function updateFeeAssignment(
  id: string,
  payload: Partial<{ amount: number; dueDate: string; lateFeeAmount: number; isVisibleToParents: boolean }>
): Promise<FeeAssignment> {
  const res = await apiClient.patch(`${BASE}/assignments/${id}`, payload);
  return handleResponse<FeeAssignment>(res);
}

export async function publishFeeAssignment(id: string): Promise<FeeAssignment> {
  const res = await apiClient.patch(`${BASE}/assignments/${id}/publish`);
  return handleResponse<FeeAssignment>(res);
}

export async function unpublishFeeAssignment(id: string): Promise<FeeAssignment> {
  const res = await apiClient.patch(`${BASE}/assignments/${id}/unpublish`);
  return handleResponse<FeeAssignment>(res);
}

export async function archiveFeeAssignment(id: string): Promise<FeeAssignment> {
  const res = await apiClient.patch(`${BASE}/assignments/${id}/archive`);
  return handleResponse<FeeAssignment>(res);
}

export async function restoreFeeAssignment(id: string): Promise<FeeAssignment> {
  const res = await apiClient.patch(`${BASE}/assignments/${id}/restore`);
  return handleResponse<FeeAssignment>(res);
}

// ─── Dashboard APIs ───────────────────────────────────────────────────────────

export async function getFeesDashboardSummary(): Promise<DashboardSummary> {
  const res = await apiClient.get(`${BASE}/dashboard/summary`);
  return handleResponse<DashboardSummary>(res);
}

export async function getCategoriesSummary(): Promise<FeeCategory[]> {
  const res = await apiClient.get(`${BASE}/dashboard/categories-summary`);
  return handleResponse<FeeCategory[]>(res);
}

// ─── Receipt Settings APIs ────────────────────────────────────────────────────

export async function getReceiptSettings(): Promise<ReceiptSettings> {
  const res = await apiClient.get(`${BASE}/receipt-settings`);
  return handleResponse<ReceiptSettings>(res);
}

export async function updateReceiptSettings(
  payload: Partial<ReceiptSettings>
): Promise<ReceiptSettings> {
  const res = await apiClient.patch(`${BASE}/receipt-settings`, payload);
  return handleResponse<ReceiptSettings>(res);
}

export async function uploadReceiptSignature(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("signature", file);
  const res = await apiClient.request(`${BASE}/receipt-settings/signature`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<{ url: string }>(res);
}
