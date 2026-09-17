/**
 * Contract tests for the school-admin payments service: the endpoints it calls
 * and the payloads it sends. The manual-payment payload is the one that moves
 * money, so its shape is pinned against `ManualPaymentDto`.
 */
import {
  MANUAL_PAYMENT_METHODS,
  createManualPayment,
  getAdminReceipts,
  getAdminSummary,
  getAdminTransactions,
  getEnabledProviders,
} from "@/app/services/payments.service";
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

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue({ success: true, data: [] });
  mockPost.mockResolvedValue({ success: true });
});

describe("transactions", () => {
  it("sends the filters that are set", async () => {
    await getAdminTransactions({ page: 2, limit: 20, status: "successful", providerName: "paystack" });
    expect(mockGet).toHaveBeenCalledWith(
      "/payments/admin/transactions?page=2&limit=20&status=successful&providerName=paystack"
    );
  });

  it("drops unset filters instead of sending empty values", async () => {
    await getAdminTransactions({ page: 1, limit: 20, status: undefined, providerName: undefined });
    expect(mockGet).toHaveBeenCalledWith("/payments/admin/transactions?page=1&limit=20");
  });
});

describe("summary, receipts and providers", () => {
  it("reads the school's totals", async () => {
    await getAdminSummary();
    expect(mockGet).toHaveBeenCalledWith("/payments/admin/summary");
  });

  it("pages receipts", async () => {
    await getAdminReceipts({ page: 3, limit: 20 });
    expect(mockGet).toHaveBeenCalledWith("/payments/admin/receipts?page=3&limit=20");
  });

  it("reads the enabled providers from the admin route, not the parent one", async () => {
    await getEnabledProviders();
    expect(mockGet).toHaveBeenCalledWith("/payments/admin/providers");
  });
});

describe("manual payment", () => {
  it("posts ids as an array, matching ManualPaymentDto", async () => {
    mockPost.mockResolvedValueOnce({
      success: true,
      transaction: { _id: "tx1" },
      receipt: { receiptNumber: "RCP-1" },
    });

    await createManualPayment({
      studentId: "507f1f77bcf86cd799439011",
      feeAssignmentIds: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
      amount: 25_000,
      paymentMethod: "cash",
    });

    expect(mockPost).toHaveBeenCalledWith("/payments/admin/manual-payment", {
      studentId: "507f1f77bcf86cd799439011",
      feeAssignmentIds: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
      amount: 25_000,
      paymentMethod: "cash",
    });
  });

  it("offers only the methods the backend settles", () => {
    expect(MANUAL_PAYMENT_METHODS.map((method) => method.value)).toEqual([
      "cash",
      "bank_transfer",
      "cheque",
      "pos",
    ]);
  });
});
