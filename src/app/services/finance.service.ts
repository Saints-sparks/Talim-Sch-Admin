import { apiClient } from "@/lib/apiClient";

const BASE = "/finance";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WalletSummary {
  ledgerBalance: number;
  availableBalance: number;
  pendingBalance: number;
  withdrawnBalance: number;
  thisMonthRevenue: number;
  currency: string;
  status: string;
  lastTransactionAt?: string;
}

export interface LedgerEntry {
  _id: string;
  type: string;
  direction: "credit" | "debit";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  description: string;
  status: string;
  relatedPaymentTransactionId?: string;
  relatedWithdrawalId?: string;
  createdAt: string;
}

export interface BankAccount {
  _id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
  isDefault: boolean;
  verifiedAt?: string;
  status: string;
  createdAt: string;
}

export interface WithdrawalRequest {
  _id: string;
  reference: string;
  amount: number;
  amountToReceive: number;
  processingFee: number;
  currency: string;
  status: string;
  note?: string;
  bankAccountId: BankAccount | string;
  requestedBy: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  processedAt?: string;
  createdAt: string;
}

export interface WithdrawalSummary {
  withdrawalDraftId: string;
  amount: number;
  platformCharge: number;
  amountToReceive: number;
  availableBalance: number;
  balanceAfterWithdrawal: number;
  bankAccount: {
    _id: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  } | null;
  note: string;
  currency: string;
}

export interface SecurityStatus {
  twoFactorEnabled: boolean;
  requireTwoFactorForWithdrawals: boolean;
  twoFactorEnabledAt?: string;
  lastSecurityUpdate?: string;
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

// ─── Wallet ───────────────────────────────────────────────────────────────────

export const getWalletSummary = async (): Promise<{ success: boolean; summary: WalletSummary }> => {
  const res = await apiClient.get(`${BASE}/wallet/summary`);
  return handleResponse<{ success: boolean; summary: WalletSummary }>(res);
};

export const getWalletTransactions = async (params: {
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedResponse<LedgerEntry>> => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
  ).toString();
  const res = await apiClient.get(`${BASE}/wallet/transactions?${qs}`);
  return handleResponse<PaginatedResponse<LedgerEntry>>(res);
};

// ─── Bank Accounts ────────────────────────────────────────────────────────────

export const getBankAccounts = async (): Promise<{ success: boolean; accounts: BankAccount[] }> => {
  const res = await apiClient.get(`${BASE}/bank-accounts`);
  return handleResponse<{ success: boolean; accounts: BankAccount[] }>(res);
};

export const addBankAccount = async (data: {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}): Promise<{ success: boolean; account: BankAccount }> => {
  const res = await apiClient.post(`${BASE}/bank-accounts`, data);
  return handleResponse<{ success: boolean; account: BankAccount }>(res);
};

export const setDefaultBankAccount = async (accountId: string) => {
  const res = await apiClient.patch(`${BASE}/bank-accounts/${accountId}/default`);
  return handleResponse(res);
};

export const verifyBankAccount = async (accountId: string) => {
  const res = await apiClient.post(`${BASE}/bank-accounts/${accountId}/verify`);
  return handleResponse(res);
};

export const removeBankAccount = async (accountId: string) => {
  const res = await apiClient.patch(`${BASE}/bank-accounts/${accountId}/remove`);
  return handleResponse(res);
};

// ─── Withdrawal Email-OTP Flow ────────────────────────────────────────────────

/** Step 1: Initiate withdrawal — sends OTP email */
export const initiateWithdrawal = async (data: {
  bankAccountId: string;
  amount: number;
  note?: string;
}): Promise<{
  success: boolean;
  withdrawalDraftId: string;
  maskedEmail: string;
  expiresIn: number;
  message: string;
}> => {
  const res = await apiClient.post(`${BASE}/withdrawals/initiate`, data);
  return handleResponse(res);
};

/** Step 2a: Resend OTP (60s cooldown enforced by backend) */
export const resendWithdrawalOtp = async (withdrawalDraftId: string): Promise<{
  success: boolean;
  maskedEmail: string;
  expiresIn: number;
  message: string;
}> => {
  const res = await apiClient.post(`${BASE}/withdrawals/resend-otp`, { withdrawalDraftId });
  return handleResponse(res);
};

/** Step 2b: Verify OTP — returns confirmation summary */
export const verifyWithdrawalOtp = async (data: {
  withdrawalDraftId: string;
  otp: string;
}): Promise<{
  success: boolean;
  verified: boolean;
  summary: WithdrawalSummary;
}> => {
  const res = await apiClient.post(`${BASE}/withdrawals/verify-otp`, data);
  return handleResponse(res);
};

/** Step 3: Confirm withdrawal — creates withdrawal request */
export const confirmWithdrawal = async (data: {
  withdrawalDraftId: string;
  confirmationAccepted: boolean;
}): Promise<{
  success: boolean;
  withdrawal: {
    _id: string;
    reference: string;
    amount: number;
    amountToReceive: number;
    platformCharge: number;
    status: string;
    bankAccount: { bankName: string; accountNumber: string; accountName: string };
    requestedAt: string;
    estimatedReviewTime: string;
  };
}> => {
  const res = await apiClient.post(`${BASE}/withdrawals/confirm`, data);
  return handleResponse(res);
};

// ─── Withdrawals List ─────────────────────────────────────────────────────────

export const getWithdrawals = async (params: {
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedResponse<WithdrawalRequest>> => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
  ).toString();
  const res = await apiClient.get(`${BASE}/withdrawals?${qs}`);
  return handleResponse<PaginatedResponse<WithdrawalRequest>>(res);
};

export const getWithdrawalById = async (id: string) => {
  const res = await apiClient.get(`${BASE}/withdrawals/${id}`);
  return handleResponse(res);
};

export const cancelWithdrawal = async (id: string) => {
  const res = await apiClient.patch(`${BASE}/withdrawals/${id}/cancel`);
  return handleResponse(res);
};

// ─── Security / 2FA (kept for settings tab) ──────────────────────────────────

export const getSecurityStatus = async (): Promise<{ success: boolean } & SecurityStatus> => {
  const res = await apiClient.get(`${BASE}/security/status`);
  return handleResponse<{ success: boolean } & SecurityStatus>(res);
};

export const setup2fa = async (): Promise<{ otpauthUrl: string; qrCode: string }> => {
  const res = await apiClient.post(`${BASE}/security/2fa/setup`);
  return handleResponse<{ otpauthUrl: string; qrCode: string }>(res);
};

export const verify2fa = async (token: string): Promise<{ success: boolean }> => {
  const res = await apiClient.post(`${BASE}/security/2fa/verify`, { token });
  return handleResponse<{ success: boolean }>(res);
};

export const disable2fa = async (token: string): Promise<{ success: boolean }> => {
  const res = await apiClient.post(`${BASE}/security/2fa/disable`, { token });
  return handleResponse<{ success: boolean }>(res);
};

export const setRequire2faForWithdrawals = async (require: boolean) => {
  const res = await apiClient.patch(`${BASE}/security/withdrawals/require-2fa`, { require });
  return handleResponse(res);
};
