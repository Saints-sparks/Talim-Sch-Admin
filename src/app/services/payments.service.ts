/**
 * School-admin payments API — fee transactions, receipts, manual payments and
 * the payment providers enabled for checkout.
 *
 * Mirrors the `admin/*` routes of `talimBE-V2/src/modules/payments`
 * (`PaymentsController`, DTOs in `data/dtos/payment.dto.ts`). Those routes sit
 * behind `manage:payments` — a different permission from the wallet's
 * `manage:finance` — so gate payment actions on `MANAGE_PAYMENTS`.
 *
 * Every function throws `ApiError` (`@/lib/apiError`) on a non-2xx, so pages
 * can branch on `error.code` and bind `fieldErrors()` to inputs. The school is
 * taken from the caller's session server-side and is never sent in a payload.
 */
import { api } from "@/lib/apiClient";
import type { ManualPaymentPayload } from "@/types/apiPayloads";

// The request payload is the backend DTO (`src/types/apiPayloads.ts`).
export type { ManualPaymentPayload } from "@/types/apiPayloads";

const BASE = "/payments";

// ─── Enums (mirror talimBE-V2 payment.enums.ts) ───────────────────────────────

/** Lifecycle of a fee payment. */
export type PaymentStatus =
  | "pending"
  | "successful"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partial";

/** Provider that processed (or would process) a payment. */
export type PaymentProviderName = "paystack" | "opay" | "stripe";

/** Whether a receipt still stands. */
export type ReceiptStatus = "issued" | "voided";

/** Methods accepted when recording a payment taken outside the platform. */
export const MANUAL_PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "pos", label: "POS" },
] as const;

/** One of the accepted manual payment methods. */
export type ManualPaymentMethod = (typeof MANUAL_PAYMENT_METHODS)[number]["value"];

// ─── Types ────────────────────────────────────────────────────────────────────

/** A fee payment as the admin transaction list returns it. */
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
  status: PaymentStatus;
  paymentChannel?: string;
  checkoutUrl?: string;
  paidAt?: string;
  failedAt?: string;
  failureReason?: string;
  receiptId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** One fee line on a receipt. */
export interface ReceiptFeeItem {
  feeName: string;
  category: string;
  description: string;
  amount: number;
}

/** A receipt issued for a settled payment. */
export interface Receipt {
  _id: string;
  schoolId: string;
  parentId: string;
  studentId: string;
  classId?: string;
  transactionId: string;
  receiptNumber: string;
  feeItems: ReceiptFeeItem[];
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
  status: ReceiptStatus;
  issuedAt: string;
  amountInWords?: string;
  createdAt: string;
}

/** Transaction totals for the school, as `GET /payments/admin/summary` returns them. */
export interface AdminSummary {
  totalTransactions: number;
  totalPaid: number;
  totalPending: number;
  totalFailed: number;
  currency?: string;
}

/** A payment provider currently configured for checkout. */
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

/** Server-paged list envelope used by the admin payment endpoints. */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total?: number;
  pagination?: { page: number; limit: number; total: number; pages: number };
}

/** Query accepted by `GET /payments/admin/transactions` (`AdminTransactionQueryDto`). */
export interface AdminTransactionQuery {
  status?: PaymentStatus;
  providerName?: PaymentProviderName;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/** Query accepted by `GET /payments/admin/receipts` (`ReceiptQueryDto`). */
export interface AdminReceiptQuery {
  studentId?: string;
  academicYearId?: string;
  termId?: string;
  page?: number;
  limit?: number;
}

/**
 * Drops undefined entries and renders the rest as a query string.
 *
 * @param params - Query values; `undefined` means "don't send it".
 * @returns The encoded query string, without a leading `?`.
 */
function toQuery(params: Record<string, string | number | undefined>): string {
  const pairs = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => [key, String(value)] as [string, string]);
  return new URLSearchParams(pairs).toString();
}

// ─── Admin endpoints ──────────────────────────────────────────────────────────

/**
 * A page of the school's fee transactions, newest first.
 *
 * @param params - Status/provider/date filters and server-side paging.
 * @returns The page of transactions and its pagination block.
 * @throws ApiError when the list cannot be read.
 */
export const getAdminTransactions = (
  params: AdminTransactionQuery = {}
): Promise<PaginatedResponse<PaymentTransaction>> =>
  api.get<PaginatedResponse<PaymentTransaction>>(
    `${BASE}/admin/transactions?${toQuery({ ...params })}`
  );

/**
 * Transaction totals for the school.
 *
 * @returns Counts and the total collected.
 * @throws ApiError when the summary cannot be read.
 */
export const getAdminSummary = (): Promise<AdminSummary & { success?: boolean }> =>
  api.get<AdminSummary & { success?: boolean }>(`${BASE}/admin/summary`);

/**
 * Records a payment taken outside the platform (cash, bank teller, POS). The
 * backend settles it through the same path as an online payment, so it credits
 * the wallet and issues a receipt.
 *
 * @param data - Student, the fee assignments being settled, amount and method.
 * @returns The created transaction and its receipt.
 * @throws ApiError (`VALIDATION_FAILED`) when an id is not a Mongo id or the fees don't match.
 */
export const createManualPayment = (
  data: ManualPaymentPayload
): Promise<{ success: boolean; transaction: PaymentTransaction; receipt: Receipt }> =>
  api.post<{ success: boolean; transaction: PaymentTransaction; receipt: Receipt }>(
    `${BASE}/admin/manual-payment`,
    data
  );

// ─── Receipts ─────────────────────────────────────────────────────────────────

/**
 * A page of the school's receipts, newest first.
 *
 * @param params - Student/term filters and server-side paging.
 * @returns The page of receipts and its pagination block.
 * @throws ApiError when the list cannot be read.
 */
export const getAdminReceipts = (
  params: AdminReceiptQuery = {}
): Promise<PaginatedResponse<Receipt>> =>
  api.get<PaginatedResponse<Receipt>>(`${BASE}/admin/receipts?${toQuery({ ...params })}`);

// ─── Providers ────────────────────────────────────────────────────────────────

/**
 * The payment providers currently enabled for checkout. Configuration is
 * platform-level; a school admin can only read this.
 *
 * @returns The enabled providers.
 * @throws ApiError when the list cannot be read.
 */
export const getEnabledProviders = (): Promise<{ success: boolean; providers: PaymentProvider[] }> =>
  api.get<{ success: boolean; providers: PaymentProvider[] }>(`${BASE}/admin/providers`);
