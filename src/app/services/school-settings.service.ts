import { apiClient } from "@/lib/apiClient";

const BASE = "/settings";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PrimaryContact {
  name: string;
  phone: string;
  email: string;
  role: string;
}

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

// ─── School Profile ───────────────────────────────────────────────────────────

export const getSchoolProfile = async (): Promise<{ success: boolean; school: SchoolProfile }> => {
  const res = await apiClient.get(`${BASE}/school-profile`);
  return handle(res);
};

export const updateSchoolProfile = async (
  dto: Partial<Pick<SchoolProfile, "logo" | "physicalAddress" | "primaryContacts">>
): Promise<{ success: boolean; school: SchoolProfile }> => {
  const res = await apiClient.patch(`${BASE}/school-profile`, dto);
  return handle(res);
};

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

// ─── Data Export ──────────────────────────────────────────────────────────────

export type ExportType = "students" | "staff" | "fees";

export interface ExportRow {
  [key: string]: string;
}

export const fetchExportData = async (
  type: ExportType
): Promise<{ success: boolean; type: string; data: ExportRow[]; count: number; message?: string }> => {
  const res = await apiClient.get(`${BASE}/data/export/${type}`);
  return handle(res);
};

export const downloadAsCsv = (rows: ExportRow[], filename: string) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ];
  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
