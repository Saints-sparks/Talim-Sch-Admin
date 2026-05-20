import { apiClient } from "@/lib/apiClient";

const BASE = "/payments";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentTransaction {
  _id: string;
  schoolId: string;
  parentId: string;
  studentId: string;
  classId?: string;
  feeAssignmentIds: string[];
  providerName: string;
  internalReference: string;
  providerReference?: string;
  amount: number;
  platformFee: number;
  schoolAmount: number;
  totalAmount: number;
  currency: string;
  status: "pending" | "successful" | "failed" | "cancelled" | "refunded" | "partial";
  paymentChannel?: string;
  checkoutUrl?: string;
  paidAt?: string;
  failedAt?: string;
  failureReason?: string;
  receiptId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Receipt {
  _id: string;
  schoolId: string;
  parentId: string;
  studentId: string;
  classId?: string;
  transactionId: string;
  receiptNumber: string;
  feeItems: { feeName: string; category: string; description: string; amount: number }[];
  subtotal: number;
  lateFee: number;
  discount: number;
  totalPaid: number;
  currency: string;
  paymentProvider: string;
  paymentMethod: string;
  transactionReference: string;
  paymentDate: string;
  verificationCode: string;
  status: "issued" | "voided";
  issuedAt: string;
  amountInWords?: string;
  createdAt: string;
}

export interface AdminSummary {
  totalTransactions: number;
  totalPaid: number;
  totalPending: number;
  totalFailed: number;
  currency?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data as T;
}

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

export const getAdminTransactions = async (params: {
  status?: string;
  providerName?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedResponse<PaymentTransaction>> => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
  ).toString();
  const res = await apiClient.get(`${BASE}/admin/transactions?${qs}`);
  return handleResponse<PaginatedResponse<PaymentTransaction>>(res);
};

export const getAdminSummary = async (): Promise<AdminSummary & { success?: boolean }> => {
  const res = await apiClient.get(`${BASE}/admin/summary`);
  return handleResponse<AdminSummary & { success?: boolean }>(res);
};

export const createManualPayment = async (data: {
  studentId: string;
  feeAssignmentIds: string[];
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}): Promise<{ success: boolean; transaction: PaymentTransaction; receipt: Receipt }> => {
  const res = await apiClient.post(`${BASE}/admin/manual-payment`, data);
  return handleResponse<{ success: boolean; transaction: PaymentTransaction; receipt: Receipt }>(res);
};

// ─── Receipts (admin view via parent receipts endpoint) ───────────────────────

export const getAdminReceipts = async (params: {
  studentId?: string;
  academicYearId?: string;
  termId?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedResponse<Receipt>> => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
  ).toString();
  const res = await apiClient.get(`${BASE}/parent/receipts?${qs}`);
  return handleResponse<PaginatedResponse<Receipt>>(res);
};

// ─── Providers (school admin read) ───────────────────────────────────────────

export interface PaymentProvider {
  providerName: string;
  isEnabled: boolean;
  isDefault: boolean;
  environment: string;
  supportedChannels: string[];
  platformFeePercent: number;
  currency: string;
  publicKey?: string;
  merchantId?: string;
  updatedAt?: string;
}

export const getEnabledProviders = async (): Promise<{ success: boolean; providers: PaymentProvider[] }> => {
  const res = await apiClient.get(`${BASE}/parent/providers`);
  return handleResponse<{ success: boolean; providers: PaymentProvider[] }>(res);
};
