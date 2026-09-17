/**
 * Contract tests for the finance service: the endpoints it calls and the exact
 * payloads it sends. The withdrawal flow is the money path, so the draft → OTP
 * → confirm sequence and the two-factor rules are pinned here.
 */
import {
  WITHDRAWAL_LIMITS,
  addBankAccount,
  cancelWithdrawal,
  confirmWithdrawal,
  getBanks,
  getWalletSummary,
  getWalletTransactions,
  getWithdrawals,
  initiateWithdrawal,
  removeBankAccount,
  resendWithdrawalOtp,
  resolveBankAccount,
  setDefaultBankAccount,
  setRequire2faForWithdrawals,
  verifyBankAccount,
  verifyWithdrawalOtp,
} from "@/app/services/finance.service";
import { api } from "@/lib/apiClient";

jest.mock("@/lib/apiClient", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPatch = api.patch as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue({ success: true });
  mockPost.mockResolvedValue({ success: true });
  mockPatch.mockResolvedValue({ success: true });
});

describe("limits mirror the backend", () => {
  it("matches InitiateWithdrawalDto's minimum and the service's daily limit", () => {
    expect(WITHDRAWAL_LIMITS.min).toBe(10_000);
    expect(WITHDRAWAL_LIMITS.daily).toBe(2_000_000);
    expect(WITHDRAWAL_LIMITS.resendCooldownSeconds).toBe(60);
  });
});

describe("wallet reads", () => {
  it("reads the wallet summary", async () => {
    await getWalletSummary();
    expect(mockGet).toHaveBeenCalledWith("/finance/wallet/summary");
  });

  it("sends only the filters that were provided", async () => {
    await getWalletTransactions({ page: 2, limit: 20, type: "credit_payment" });
    expect(mockGet).toHaveBeenCalledWith(
      "/finance/wallet/transactions?page=2&limit=20&type=credit_payment"
    );
  });

  it("omits undefined filters rather than sending the string 'undefined'", async () => {
    await getWalletTransactions({ page: 1, limit: 20, type: undefined });
    expect(mockGet).toHaveBeenCalledWith("/finance/wallet/transactions?page=1&limit=20");
  });

  it("pages withdrawals by status", async () => {
    await getWithdrawals({ status: "pending", page: 3, limit: 20 });
    expect(mockGet).toHaveBeenCalledWith("/finance/withdrawals?status=pending&page=3&limit=20");
  });
});

describe("bank accounts", () => {
  it("posts the add-account payload the DTO expects", async () => {
    await addBankAccount({
      bankName: "GTBank",
      bankCode: "058",
      accountNumber: "0123456789",
      accountName: "Talim Model School",
    });
    expect(mockPost).toHaveBeenCalledWith("/finance/bank-accounts", {
      bankName: "GTBank",
      bankCode: "058",
      accountNumber: "0123456789",
      accountName: "Talim Model School",
    });
  });

  it("resolves an account name through the provider proxy", async () => {
    await resolveBankAccount("0123456789", "058");
    expect(mockGet).toHaveBeenCalledWith(
      "/finance/bank-accounts/resolve?accountNumber=0123456789&bankCode=058"
    );
  });

  it("reads the bank list for a country", async () => {
    await getBanks();
    expect(mockGet).toHaveBeenCalledWith("/finance/banks?country=nigeria");
  });

  it("verifies, promotes and removes with the documented verbs", async () => {
    await verifyBankAccount("acct1");
    expect(mockPost).toHaveBeenCalledWith("/finance/bank-accounts/acct1/verify");

    await setDefaultBankAccount("acct1");
    expect(mockPatch).toHaveBeenCalledWith("/finance/bank-accounts/acct1/default");

    await removeBankAccount("acct1");
    expect(mockPatch).toHaveBeenCalledWith("/finance/bank-accounts/acct1/remove");
  });
});

describe("withdrawal flow", () => {
  it("step 1 posts the initiate payload and drops an empty note", async () => {
    await initiateWithdrawal({ bankAccountId: "acct1", amount: 50_000 });
    expect(mockPost).toHaveBeenCalledWith("/finance/withdrawals/initiate", {
      bankAccountId: "acct1",
      amount: 50_000,
    });
  });

  it("step 2a resends against the draft id", async () => {
    await resendWithdrawalOtp("draft1");
    expect(mockPost).toHaveBeenCalledWith("/finance/withdrawals/resend-otp", {
      withdrawalDraftId: "draft1",
    });
  });

  it("step 2b verifies the emailed code", async () => {
    await verifyWithdrawalOtp({ withdrawalDraftId: "draft1", otp: "123456" });
    expect(mockPost).toHaveBeenCalledWith("/finance/withdrawals/verify-otp", {
      withdrawalDraftId: "draft1",
      otp: "123456",
    });
  });

  it("step 3 confirms without a two-factor code when none is required", async () => {
    await confirmWithdrawal({ withdrawalDraftId: "draft1", confirmationAccepted: true });
    expect(mockPost).toHaveBeenCalledWith("/finance/withdrawals/confirm", {
      withdrawalDraftId: "draft1",
      confirmationAccepted: true,
    });
  });

  it("step 3 carries the authenticator code when the school requires one", async () => {
    await confirmWithdrawal({
      withdrawalDraftId: "draft1",
      confirmationAccepted: true,
      twoFactorCode: "654321",
    });
    expect(mockPost).toHaveBeenCalledWith("/finance/withdrawals/confirm", {
      withdrawalDraftId: "draft1",
      confirmationAccepted: true,
      twoFactorCode: "654321",
    });
  });

  it("cancels a pending withdrawal", async () => {
    await cancelWithdrawal("wd1");
    expect(mockPatch).toHaveBeenCalledWith("/finance/withdrawals/wd1/cancel");
  });
});

describe("require 2FA for withdrawals", () => {
  it("turns the requirement on without a code", async () => {
    await setRequire2faForWithdrawals(true);
    expect(mockPatch).toHaveBeenCalledWith("/finance/security/withdrawals/require-2fa", {
      require: true,
    });
  });

  it("sends the current code when turning the requirement off", async () => {
    await setRequire2faForWithdrawals(false, "123456");
    expect(mockPatch).toHaveBeenCalledWith("/finance/security/withdrawals/require-2fa", {
      require: false,
      token: "123456",
    });
  });
});
