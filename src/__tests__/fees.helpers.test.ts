/**
 * The fees screens' formatting and error helpers.
 */
import { ApiError } from "@/lib/apiError";
import { feesErrorMessage, isRetryableFeesError } from "@/components/fees/errors";
import {
  feeTypeLabel,
  formatDate,
  formatNaira,
  refId,
  refName,
  toDateInputValue,
  totalCapacity,
} from "@/components/fees/formatters";

describe("feesErrorMessage", () => {
  it("says what to do when the browser is offline", () => {
    expect(feesErrorMessage(ApiError.offline(), "fee items")).toMatch(/offline/i);
  });

  it("explains a timeout in terms of what was loading", () => {
    expect(feesErrorMessage(ApiError.timeout(), "fee items")).toMatch(/fee items/);
  });

  it("turns a 403 into a permission message", () => {
    const error = new ApiError("FORBIDDEN", "Forbidden resource", 403);
    expect(feesErrorMessage(error)).toMatch(/don't have access/i);
  });

  it("surfaces the first field reason of a validation failure", () => {
    const error = new ApiError("VALIDATION_FAILED", "Validation failed", 400, [
      { field: "defaultAmount", reason: "defaultAmount must not be less than 0" },
    ]);
    expect(feesErrorMessage(error)).toBe("defaultAmount must not be less than 0");
  });

  it("keeps the server's own message for anything else", () => {
    const error = new ApiError("CONFLICT", "That fee is already assigned to the class", 409);
    expect(feesErrorMessage(error)).toBe("That fee is already assigned to the class");
  });

  it("falls back for a non-ApiError", () => {
    expect(feesErrorMessage(new Error(""), "fee items")).toBe("Could not load fee items.");
  });
});

describe("isRetryableFeesError", () => {
  it("is true for network failures and false for a 404", () => {
    expect(isRetryableFeesError(ApiError.offline())).toBe(true);
    expect(isRetryableFeesError(new ApiError("NOT_FOUND", "Fee item not found", 404))).toBe(false);
  });
});

describe("formatters", () => {
  it("formats money with the NGN prefix and thousands separators", () => {
    expect(formatNaira(15000)).toBe("NGN 15,000");
    expect(formatNaira(0)).toBe("NGN 0");
  });

  it("formats a date and falls back when there is none", () => {
    // UTC midnight must not slip to the previous day west of Greenwich.
    expect(formatDate("2026-09-01T00:00:00.000Z")).toMatch(/^01 Sep\w* 2026$/);
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("not a date", "Not set")).toBe("Not set");
  });

  it("reduces a timestamp to a date input value", () => {
    expect(toDateInputValue("2026-09-01T10:30:00.000Z")).toBe("2026-09-01");
    expect(toDateInputValue(undefined)).toBe("");
  });

  it("reads references whether they are populated or not", () => {
    expect(refId("cat-1")).toBe("cat-1");
    expect(refId({ _id: "cat-1", name: "Tuition" })).toBe("cat-1");
    expect(refId(undefined)).toBe("");
    expect(refName({ _id: "c1", name: "JSS 1" })).toBe("JSS 1");
    expect(refName("c1")).toBe("—");
    expect(refName(undefined, "")).toBe("");
  });

  it("labels fee types without their underscores", () => {
    expect(feeTypeLabel("one_time")).toBe("one time");
  });

  it("totals class capacities, treating a missing one as zero", () => {
    expect(totalCapacity([{ classCapacity: "30" }, { classCapacity: 25 }, {}])).toBe(55);
  });
});
