/**
 * The create/edit fee form's rules.
 *
 * These are the checks that stop a bad amount or a half-filled fee reaching
 * the API, so they are pinned against `CreateFeeItemDto`.
 */
import {
  EMPTY_FEE_FORM,
  feeFormFromItem,
  feeFormToPayload,
  validateFeeForm,
  type FeeFormValues,
} from "@/hooks/fees/feeForm";
import type { FeeItem } from "@/app/services/fees.service";

function valid(overrides: Partial<FeeFormValues> = {}): FeeFormValues {
  return {
    ...EMPTY_FEE_FORM,
    name: "Tuition",
    categoryId: "cat-1",
    defaultAmount: "15000",
    ...overrides,
  };
}

describe("validateFeeForm", () => {
  it("accepts a complete form", () => {
    expect(validateFeeForm(valid())).toEqual({});
  });

  it("requires a name and a category", () => {
    const errors = validateFeeForm(valid({ name: "   ", categoryId: "" }));
    expect(errors.name).toBeDefined();
    expect(errors.categoryId).toBeDefined();
  });

  it("enforces the DTO's 150-character name limit", () => {
    expect(validateFeeForm(valid({ name: "a".repeat(151) })).name).toContain("150");
    expect(validateFeeForm(valid({ name: "a".repeat(150) })).name).toBeUndefined();
  });

  it("enforces the DTO's 500-character description limit", () => {
    expect(validateFeeForm(valid({ description: "d".repeat(501) })).description).toContain("500");
  });

  it("requires an amount and rejects a negative or non-numeric one", () => {
    expect(validateFeeForm(valid({ defaultAmount: "" })).defaultAmount).toBeDefined();
    expect(validateFeeForm(valid({ defaultAmount: "-1" })).defaultAmount).toContain("negative");
    expect(validateFeeForm(valid({ defaultAmount: "abc" })).defaultAmount).toBeDefined();
  });

  it("allows an amount of zero", () => {
    expect(validateFeeForm(valid({ defaultAmount: "0" })).defaultAmount).toBeUndefined();
  });

  it("rejects a negative late fee but allows an empty one", () => {
    expect(validateFeeForm(valid({ lateFeeAmount: "-5" })).lateFeeAmount).toContain("negative");
    expect(validateFeeForm(valid({ lateFeeAmount: "" })).lateFeeAmount).toBeUndefined();
  });

  it("only demands a due date when classes are being assigned", () => {
    expect(validateFeeForm(valid({ defaultDueDate: "" })).defaultDueDate).toBeUndefined();
    expect(
      validateFeeForm(valid({ defaultDueDate: "" }), { assigningClasses: true }).defaultDueDate
    ).toBeDefined();
    expect(
      validateFeeForm(valid({ defaultDueDate: "2026-09-01" }), { assigningClasses: true })
        .defaultDueDate
    ).toBeUndefined();
  });
});

describe("feeFormToPayload", () => {
  it("sends the DTO fields, trimmed and typed", () => {
    const payload = feeFormToPayload(
      valid({
        name: "  Tuition  ",
        description: "  Termly tuition  ",
        defaultAmount: "15000",
        lateFeeAmount: "500",
        defaultDueDate: "2026-09-01",
        feeType: "termly",
        status: "active",
      })
    );

    expect(payload).toEqual({
      name: "Tuition",
      categoryId: "cat-1",
      description: "Termly tuition",
      academicYearId: undefined,
      termId: undefined,
      feeType: "termly",
      defaultAmount: 15000,
      defaultDueDate: "2026-09-01",
      lateFeeAmount: 500,
      allowPartialPayment: false,
      isVisibleToParents: true,
      includeInCollection: true,
      status: "active",
    });
  });

  it("omits optional ids rather than sending empty strings the DTO rejects", () => {
    const payload = feeFormToPayload(valid({ academicYearId: "", termId: "", description: "" }));
    expect(payload.academicYearId).toBeUndefined();
    expect(payload.termId).toBeUndefined();
    expect(payload.description).toBeUndefined();
  });

  it("passes the chosen academic year and term through", () => {
    const payload = feeFormToPayload(valid({ academicYearId: "ay-1", termId: "t-1" }));
    expect(payload.academicYearId).toBe("ay-1");
    expect(payload.termId).toBe("t-1");
  });

  it("defaults an empty late fee to 0", () => {
    expect(feeFormToPayload(valid({ lateFeeAmount: "" })).lateFeeAmount).toBe(0);
  });
});

describe("feeFormFromItem", () => {
  const item = {
    _id: "fi-1",
    name: "Tuition",
    categoryId: { _id: "cat-1", name: "Tuition Fees" },
    description: "Termly",
    academicYearId: "ay-1",
    termId: { _id: "t-1", name: "First Term" },
    feeType: "termly",
    defaultAmount: 15000,
    defaultDueDate: "2026-09-01T00:00:00.000Z",
    lateFeeAmount: 0,
    allowPartialPayment: true,
    isVisibleToParents: false,
    includeInCollection: true,
    status: "active",
    createdAt: "",
    updatedAt: "",
  } as FeeItem;

  it("unwraps populated references to their ids", () => {
    const values = feeFormFromItem(item);
    expect(values.categoryId).toBe("cat-1");
    expect(values.academicYearId).toBe("ay-1");
    expect(values.termId).toBe("t-1");
  });

  it("reduces the due date to what a date input accepts", () => {
    expect(feeFormFromItem(item).defaultDueDate).toBe("2026-09-01");
  });

  it("leaves a zero late fee blank instead of showing '0'", () => {
    expect(feeFormFromItem(item).lateFeeAmount).toBe("");
  });

  it("opens an archived fee as a draft, since archived is not a savable status", () => {
    expect(feeFormFromItem({ ...item, status: "archived" }).status).toBe("draft");
  });

  it("round-trips through the payload builder", () => {
    const payload = feeFormToPayload(feeFormFromItem(item));
    expect(payload.defaultAmount).toBe(15000);
    expect(payload.categoryId).toBe("cat-1");
    expect(payload.termId).toBe("t-1");
    expect(payload.isVisibleToParents).toBe(false);
  });
});
