import { apiClient } from "@/lib/apiClient";

const BASE = "/settings";

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface FinanceSettings {
  schoolId: string;
  requireEmailOtpForWithdrawals: boolean;
  minimumWithdrawalAmount: number;
  defaultBankAccountId: string | null;
}

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data as T;
}

// ─── Receipt Settings ─────────────────────────────────────────────────────────

export const getReceiptSettings = async (): Promise<{ success: boolean; settings: ReceiptSettings }> => {
  const res = await apiClient.get(`${BASE}/receipt`);
  return handle(res);
};

export const updateReceiptSettings = async (
  dto: Partial<ReceiptSettings>
): Promise<{ success: boolean; settings: ReceiptSettings }> => {
  const res = await apiClient.patch(`${BASE}/receipt`, dto);
  return handle(res);
};

// ─── Finance Settings ─────────────────────────────────────────────────────────

export const getFinanceSettings = async (): Promise<{ success: boolean; settings: FinanceSettings }> => {
  const res = await apiClient.get(`${BASE}/finance`);
  return handle(res);
};

export const updateFinanceSettings = async (
  dto: Partial<FinanceSettings>
): Promise<{ success: boolean; settings: FinanceSettings }> => {
  const res = await apiClient.patch(`${BASE}/finance`, dto);
  return handle(res);
};

// ─── Security ─────────────────────────────────────────────────────────────────

export const changeSettingsPassword = async (dto: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ success: boolean; message: string }> => {
  const res = await apiClient.post(`${BASE}/security/change-password`, dto);
  return handle(res);
};
