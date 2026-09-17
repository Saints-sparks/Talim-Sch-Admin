/**
 * The money formatting and error copy that the finance and payments screens
 * share. `amountInWords` is what an admin reads back before sending an OTP, so
 * it is worth pinning.
 */
import {
  amountInWords,
  formatDate,
  formatDateTime,
  formatNaira,
  maskAccountNumber,
} from "@/components/finance/formatters";
import { describeFinanceError, financeActionMessage } from "@/components/finance/financeErrors";
import { ApiError } from "@/lib/apiError";

describe("formatNaira", () => {
  it("always shows two decimals with thousands separators", () => {
    expect(formatNaira(1_250_000)).toBe("₦1,250,000.00");
    expect(formatNaira(1234.5)).toBe("₦1,234.50");
  });

  it("renders a missing or unusable amount as zero rather than NaN", () => {
    expect(formatNaira(undefined)).toBe("₦0.00");
    expect(formatNaira(null)).toBe("₦0.00");
    expect(formatNaira(Number.NaN)).toBe("₦0.00");
  });
});

describe("amountInWords", () => {
  it("spells amounts the way a cheque reads", () => {
    expect(amountInWords(50_000)).toBe("Fifty Thousand Naira Only");
    expect(amountInWords(1_250_000)).toBe("One Million Two Hundred Fifty Thousand Naira Only");
    expect(amountInWords(19)).toBe("Nineteen Naira Only");
  });

  it("says nothing for a zero or negative amount", () => {
    expect(amountInWords(0)).toBe("");
    expect(amountInWords(-100)).toBe("");
  });
});

describe("dates", () => {
  it("renders an em dash rather than 'Invalid Date'", () => {
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("not-a-date")).toBe("—");
    expect(formatDateTime(undefined)).toBe("—");
  });

  it("formats a real timestamp", () => {
    expect(formatDate("2026-03-04T10:00:00.000Z")).toBe("04 Mar 2026");
  });
});

describe("maskAccountNumber", () => {
  it("keeps only the last four digits", () => {
    expect(maskAccountNumber("0123456789")).toBe("****6789");
  });
});

describe("describeFinanceError", () => {
  it("does not offer a retry for a permission failure", () => {
    const copy = describeFinanceError(new ApiError("FORBIDDEN", "nope", 403), "wallet balances");
    expect(copy.retryable).toBe(false);
    expect(copy.title).toMatch(/no access/i);
  });

  it("does not offer a retry for a suspended wallet, and keeps the server's reason", () => {
    const copy = describeFinanceError(
      new ApiError("WALLET_UNAVAILABLE", "School wallet is suspended. Contact support.", 409),
      "wallet balances"
    );
    expect(copy.retryable).toBe(false);
    expect(copy.message).toContain("suspended");
  });

  it("offers a retry for a transient server failure", () => {
    const copy = describeFinanceError(new ApiError("INTERNAL_ERROR", "boom", 500), "the ledger");
    expect(copy.retryable).toBe(true);
  });
});

describe("financeActionMessage", () => {
  it("surfaces the field reason from a validation failure", () => {
    const error = new ApiError("VALIDATION_FAILED", "Some fields need attention.", 400, [
      { field: "twoFactorCode", reason: "Enter the 6-digit code from your authenticator app" },
    ]);
    expect(financeActionMessage(error, "fallback")).toMatch(/6-digit code/);
  });

  it("keeps the server's message for an insufficient balance", () => {
    const error = new ApiError(
      "INSUFFICIENT_BALANCE",
      "Withdrawal amount ₦500,000.00 exceeds available balance ₦120,000.00",
      400
    );
    expect(financeActionMessage(error, "fallback")).toContain("exceeds available balance");
  });

  it("falls back for a non-API error", () => {
    expect(financeActionMessage("boom", "Failed to cancel")).toBe("Failed to cancel");
  });
});
