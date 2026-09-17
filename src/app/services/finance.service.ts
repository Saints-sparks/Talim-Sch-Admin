/**
 * School finance API — wallet, ledger, payout bank accounts, the OTP-guarded
 * withdrawal flow and the caller's two-factor settings.
 *
 * Mirrors `talimBE-V2/src/modules/finance` (controller `FinanceController`,
 * DTOs in `data/dtos/finance.dto.ts`). Every school route there is behind
 * `manage:finance`, so a caller without that permission gets `FORBIDDEN`.
 *
 * All functions throw `ApiError` (`@/lib/apiError`) on any non-2xx, carrying
 * the server's `code`, `message` and field `details` — pages branch on `code`
 * and map `fieldErrors()` onto inputs. School scoping is server-side: the
 * school id comes from the caller's session, never from a payload.
 */
import { api } from "@/lib/apiClient";

const BASE = "/finance";

// ─── Enums (mirror talimBE-V2 payment.enums.ts) ───────────────────────────────

/** Lifecycle of a withdrawal request. */
export type WithdrawalStatus =
  | "pending"
  | "approved"
  | "processing"
  | "completed"
  | "rejected"
  | "failed"
  | "cancelled";

/** Lifecycle of a payout bank account. */
export type BankAccountStatus = "active" | "inactive" | "removed";

/** Why a ledger entry exists. */
export type WalletEntryType =
  | "credit_payment"
  | "debit_withdrawal"
  | "withdrawal_reversal"
  | "platform_fee"
  | "refund"
  | "manual_adjustment";

/** Whether a ledger entry added to or took from the wallet. */
export type WalletEntryDirection = "credit" | "debit";

/** Posting state of a ledger entry. */
export type WalletEntryStatus = "pending" | "posted" | "reversed" | "failed";

/** Whether the school's wallet can move money at all. */
export type WalletStatus = "active" | "suspended" | "closed";

/** Withdrawal statuses a school admin may cancel. */
export const CANCELLABLE_WITHDRAWAL_STATUSES: readonly WithdrawalStatus[] = ["pending"];

/**
 * Server-enforced withdrawal limits (`finance.service.ts` MIN_WITHDRAWAL /
 * DAILY_LIMIT). Mirrored here so the form can refuse an impossible amount
 * before spending a round trip — the server remains the authority.
 */
export const WITHDRAWAL_LIMITS = {
  /** Smallest single withdrawal, in naira. */
  min: 10_000,
  /** Most a school may withdraw in one Lagos day, in naira. */
  daily: 2_000_000,
  /** Seconds the backend makes a caller wait before resending the email OTP. */
  resendCooldownSeconds: 60,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

/** Wallet balances and this month's revenue, as `GET /finance/wallet/summary` returns them. */
export interface WalletSummary {
  ledgerBalance: number;
  availableBalance: number;
  pendingBalance: number;
  withdrawnBalance: number;
  thisMonthRevenue: number;
  currency: string;
  status: WalletStatus;
  lastTransactionAt?: string;
}

/** One line of the wallet ledger. */
export interface LedgerEntry {
  _id: string;
  type: WalletEntryType;
  direction: WalletEntryDirection;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  description: string;
  status: WalletEntryStatus;
  relatedPaymentTransactionId?: string;
  relatedWithdrawalId?: string;
  createdAt: string;
}

/** A payout account the school withdraws to. */
export interface BankAccount {
  _id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
  isDefault: boolean;
  verifiedAt?: string;
  status: BankAccountStatus;
  createdAt: string;
}

/** A submitted withdrawal request. `bankAccountId` is populated on list reads. */
export interface WithdrawalRequest {
  _id: string;
  reference: string;
  amount: number;
  amountToReceive: number;
  processingFee: number;
  currency: string;
  status: WithdrawalStatus;
  note?: string;
  bankAccountId: BankAccount | string;
  requestedBy: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  processedAt?: string;
  createdAt: string;
}

/** The figures shown on the confirmation step, returned once the OTP verifies. */
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

/** The withdrawal as `POST /finance/withdrawals/confirm` reports it back. */
export interface ConfirmedWithdrawal {
  _id: string;
  reference: string;
  amount: number;
  amountToReceive: number;
  platformCharge: number;
  status: WithdrawalStatus;
  bankAccount: { bankName: string; accountNumber: string; accountName: string };
  requestedAt: string;
  estimatedReviewTime: string;
}

/** The caller's two-factor state (per user, not per school). */
export interface SecurityStatus {
  twoFactorEnabled: boolean;
  requireTwoFactorForWithdrawals: boolean;
  twoFactorEnabledAt?: string;
  lastSecurityUpdate?: string;
}

/** A bank from the Paystack list proxied by `GET /finance/banks`. */
export interface PaystackBank {
  id: number;
  name: string;
  code: string;
  slug: string;
}

/** Server-paged list envelope used by the ledger and withdrawal endpoints. */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

/** Query accepted by `GET /finance/wallet/transactions` (`WalletTransactionQueryDto`). */
export interface WalletTransactionQuery {
  type?: WalletEntryType;
  status?: WalletEntryStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/** Query accepted by `GET /finance/withdrawals` (`WithdrawalQueryDto`). */
export interface WithdrawalQuery {
  status?: WithdrawalStatus;
  page?: number;
  limit?: number;
}

/** Body of `POST /finance/bank-accounts` (`AddBankAccountDto`). */
export interface AddBankAccountPayload {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  country?: string;
}

/** Body of `POST /finance/withdrawals/initiate` (`InitiateWithdrawalDto`). */
export interface InitiateWithdrawalPayload {
  bankAccountId: string;
  amount: number;
  note?: string;
}

/** Body of `POST /finance/withdrawals/confirm` (`ConfirmWithdrawalDto`). */
export interface ConfirmWithdrawalPayload {
  withdrawalDraftId: string;
  confirmationAccepted: boolean;
  /** Required when "Require 2FA for withdrawals" is on: the 6-digit authenticator code. */
  twoFactorCode?: string;
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

// ─── Wallet ───────────────────────────────────────────────────────────────────

/**
 * The school's wallet balances.
 *
 * @returns Balances plus the wallet's status.
 * @throws ApiError when the wallet cannot be read.
 */
export const getWalletSummary = (): Promise<{ success: boolean; summary: WalletSummary }> =>
  api.get<{ success: boolean; summary: WalletSummary }>(`${BASE}/wallet/summary`);

/**
 * A page of the wallet ledger, newest first.
 *
 * @param params - Type/status/date filters and server-side paging.
 * @returns The page of entries and its pagination block.
 * @throws ApiError when the ledger cannot be read.
 */
export const getWalletTransactions = (
  params: WalletTransactionQuery = {}
): Promise<PaginatedResponse<LedgerEntry>> =>
  api.get<PaginatedResponse<LedgerEntry>>(`${BASE}/wallet/transactions?${toQuery({ ...params })}`);

// ─── Paystack proxy ───────────────────────────────────────────────────────────

/**
 * The bank list for a country, proxied from Paystack.
 *
 * @param country - Paystack country slug; the backend defaults to nigeria.
 * @returns The banks, each with the code the add-account payload needs.
 * @throws ApiError (`PAYMENT_PROVIDER_ERROR`) when the provider is unreachable.
 */
export const getBanks = (country = "nigeria"): Promise<{ success: boolean; banks: PaystackBank[] }> =>
  api.get<{ success: boolean; banks: PaystackBank[] }>(`${BASE}/banks?country=${encodeURIComponent(country)}`);

/**
 * The name the bank holds for an account number.
 *
 * Verification later compares this name with the one stored on the account, so
 * the add-account form uses it rather than trusting typed input.
 *
 * @param accountNumber - Account number to resolve.
 * @param bankCode - Bank code from `getBanks`.
 * @returns The resolved account name.
 * @throws ApiError (`VALIDATION_FAILED` or `PAYMENT_PROVIDER_ERROR`) when it cannot be resolved.
 */
export const resolveBankAccount = (
  accountNumber: string,
  bankCode: string
): Promise<{ success: boolean; accountName: string }> =>
  api.get<{ success: boolean; accountName: string }>(
    `${BASE}/bank-accounts/resolve?${toQuery({ accountNumber, bankCode })}`
  );

// ─── Bank accounts ────────────────────────────────────────────────────────────

/**
 * The school's payout accounts.
 *
 * @returns Every account, removed ones included (they carry `status: "removed"`).
 * @throws ApiError when the list cannot be read.
 */
export const getBankAccounts = (): Promise<{ success: boolean; accounts: BankAccount[] }> =>
  api.get<{ success: boolean; accounts: BankAccount[] }>(`${BASE}/bank-accounts`);

/**
 * Adds a payout account. It starts unverified and cannot receive a withdrawal
 * until `verifyBankAccount` matches its name against the bank's records.
 *
 * @param data - Bank, account number and the name as the bank holds it.
 * @returns The created account.
 * @throws ApiError (`CONFLICT`) when the school already has that account.
 */
export const addBankAccount = (
  data: AddBankAccountPayload
): Promise<{ success: boolean; account: BankAccount }> =>
  api.post<{ success: boolean; account: BankAccount }>(`${BASE}/bank-accounts`, data);

/**
 * Makes a verified account the one new withdrawals default to.
 *
 * @param accountId - Account to promote.
 * @returns The updated account.
 * @throws ApiError (`BAD_REQUEST`) when the account is unverified or inactive.
 */
export const setDefaultBankAccount = (
  accountId: string
): Promise<{ success: boolean; account: BankAccount }> =>
  api.patch<{ success: boolean; account: BankAccount }>(`${BASE}/bank-accounts/${accountId}/default`);

/**
 * Verifies an account against the bank's records.
 *
 * @param accountId - Account to verify.
 * @returns The verified account.
 * @throws ApiError (`BAD_REQUEST`) when the bank reports a different account name.
 */
export const verifyBankAccount = (
  accountId: string
): Promise<{ success: boolean; account: BankAccount }> =>
  api.post<{ success: boolean; account: BankAccount }>(`${BASE}/bank-accounts/${accountId}/verify`);

/**
 * Removes a payout account.
 *
 * @param accountId - Account to remove.
 * @returns The removal acknowledgement.
 * @throws ApiError (`CONFLICT`) when a withdrawal against it is still pending.
 */
export const removeBankAccount = (accountId: string): Promise<{ success: boolean }> =>
  api.patch<{ success: boolean }>(`${BASE}/bank-accounts/${accountId}/remove`);

// ─── Withdrawal email-OTP flow ────────────────────────────────────────────────

/**
 * Step 1 — validates the amount and account, then emails a 6-digit code.
 *
 * Nothing is debited here: the draft only becomes a withdrawal at step 3.
 *
 * @param data - Target account, amount in naira and an optional note.
 * @returns The draft id to carry through the rest of the flow, plus the masked email.
 * @throws ApiError (`INSUFFICIENT_BALANCE`, `WALLET_UNAVAILABLE`, `BAD_REQUEST`).
 */
export const initiateWithdrawal = (
  data: InitiateWithdrawalPayload
): Promise<{
  success: boolean;
  withdrawalDraftId: string;
  maskedEmail: string;
  /** Seconds the emailed code stays valid (600). */
  expiresIn: number;
  message: string;
}> => api.post(`${BASE}/withdrawals/initiate`, data);

/**
 * Step 2a — resends the email code. The backend enforces a 60-second cooldown
 * and at most three resends per draft.
 *
 * @param withdrawalDraftId - Draft from `initiateWithdrawal`.
 * @returns The masked email and the new validity window.
 * @throws ApiError (`BAD_REQUEST`) while the cooldown is running or once resends run out.
 */
export const resendWithdrawalOtp = (
  withdrawalDraftId: string
): Promise<{ success: boolean; maskedEmail: string; expiresIn: number; message: string }> =>
  api.post(`${BASE}/withdrawals/resend-otp`, { withdrawalDraftId });

/**
 * Step 2b — verifies the emailed code and returns the confirmation figures.
 *
 * @param data - Draft id and the 6-digit code.
 * @returns The summary shown on the confirm step.
 * @throws ApiError (`UNAUTHENTICATED`) on a wrong code, (`BAD_REQUEST`) once it expires.
 */
export const verifyWithdrawalOtp = (data: {
  withdrawalDraftId: string;
  otp: string;
}): Promise<{ success: boolean; verified: boolean; summary: WithdrawalSummary }> =>
  api.post(`${BASE}/withdrawals/verify-otp`, data);

/**
 * Step 3 — creates the withdrawal and holds the funds.
 *
 * When the school requires two-factor for withdrawals the server refuses a
 * payload without `twoFactorCode` with `VALIDATION_FAILED` on that field, so
 * the confirm step can ask for the code even if the setting changed mid-flow.
 *
 * @param data - Draft id, the accepted confirmation and, when required, the authenticator code.
 * @returns The created withdrawal request.
 * @throws ApiError (`VALIDATION_FAILED`, `CONFLICT`, `BAD_REQUEST`).
 */
export const confirmWithdrawal = (
  data: ConfirmWithdrawalPayload
): Promise<{ success: boolean; withdrawal: ConfirmedWithdrawal }> =>
  api.post(`${BASE}/withdrawals/confirm`, data);

// ─── Withdrawals list ─────────────────────────────────────────────────────────

/**
 * A page of the school's withdrawals, newest first.
 *
 * @param params - Status filter and server-side paging.
 * @returns The page of withdrawals and its pagination block.
 * @throws ApiError when the list cannot be read.
 */
export const getWithdrawals = (
  params: WithdrawalQuery = {}
): Promise<PaginatedResponse<WithdrawalRequest>> =>
  api.get<PaginatedResponse<WithdrawalRequest>>(`${BASE}/withdrawals?${toQuery({ ...params })}`);

/**
 * One withdrawal belonging to the school.
 *
 * @param id - Withdrawal id.
 * @returns The withdrawal.
 * @throws ApiError (`NOT_FOUND`) when it belongs to another school.
 */
export const getWithdrawalById = (
  id: string
): Promise<{ success: boolean; withdrawal: WithdrawalRequest }> =>
  api.get<{ success: boolean; withdrawal: WithdrawalRequest }>(`${BASE}/withdrawals/${id}`);

/**
 * Cancels a pending withdrawal and releases the hold. Only the admin who
 * requested it may cancel, and only while it is still pending.
 *
 * @param id - Withdrawal id.
 * @returns The cancellation acknowledgement.
 * @throws ApiError (`INVALID_STATE_TRANSITION`) once review has started, (`FORBIDDEN`) for another admin's request.
 */
export const cancelWithdrawal = (id: string): Promise<{ success: boolean }> =>
  api.patch<{ success: boolean }>(`${BASE}/withdrawals/${id}/cancel`);

// ─── Security / 2FA ───────────────────────────────────────────────────────────

/**
 * The caller's two-factor state.
 *
 * @returns Whether 2FA is enabled and whether it is required for withdrawals.
 * @throws ApiError when the status cannot be read.
 */
export const getSecurityStatus = (): Promise<{ success: boolean } & SecurityStatus> =>
  api.get<{ success: boolean } & SecurityStatus>(`${BASE}/security/status`);

/**
 * Starts two-factor enrolment.
 *
 * @returns The otpauth URL and a QR data-URL to scan.
 * @throws ApiError (`CONFLICT`) when 2FA is already enabled.
 */
export const setup2fa = (): Promise<{ otpauthUrl: string; qrCode: string }> =>
  api.post<{ otpauthUrl: string; qrCode: string }>(`${BASE}/security/2fa/setup`);

/**
 * Confirms an authenticator code and enables two-factor.
 *
 * @param token - 6-digit code from the authenticator app.
 * @returns The success acknowledgement.
 * @throws ApiError (`UNAUTHENTICATED`) when the code is wrong or already used.
 */
export const verify2fa = (token: string): Promise<{ success: boolean }> =>
  api.post<{ success: boolean }>(`${BASE}/security/2fa/verify`, { token });

/**
 * Disables two-factor.
 *
 * @param token - Current 6-digit code; the server refuses without it.
 * @returns The success acknowledgement.
 * @throws ApiError (`UNAUTHENTICATED`) when the code is wrong.
 */
export const disable2fa = (token: string): Promise<{ success: boolean }> =>
  api.post<{ success: boolean }>(`${BASE}/security/2fa/disable`, { token });

/**
 * Turns "Require 2FA for withdrawals" on or off. Turning it OFF needs a
 * current authenticator code, so a stolen session cannot switch the
 * requirement off and then withdraw without one.
 *
 * @param require - New setting.
 * @param token - 6-digit code; required when turning the requirement off.
 * @returns The success acknowledgement.
 * @throws ApiError (`VALIDATION_FAILED` on `token`) when turning it off without a code.
 */
export const setRequire2faForWithdrawals = (
  require: boolean,
  token?: string
): Promise<{ success: boolean }> =>
  api.patch<{ success: boolean }>(
    `${BASE}/security/withdrawals/require-2fa`,
    token ? { require, token } : { require }
  );
