/**
 * The assign wizard's rules: what each class is charged, and what reaches
 * `POST /fees/assignments`.
 */
import {
  buildAssignPayload,
  defaultOverride,
  overrideFor,
  validateOverrides,
  type OverrideMap,
} from "@/hooks/fees/assignWizard";
import type { FeeItem } from "@/app/services/fees.service";

const fee = {
  _id: "fi-1",
  name: "Tuition",
  categoryId: "cat-1",
  description: "",
  feeType: "termly",
  defaultAmount: 15000,
  defaultDueDate: "2026-09-01T00:00:00.000Z",
  lateFeeAmount: 500,
  allowPartialPayment: false,
  isVisibleToParents: true,
  includeInCollection: true,
  status: "active",
  createdAt: "",
  updatedAt: "",
} as FeeItem;

describe("defaultOverride", () => {
  it("starts a class off on the fee's own defaults", () => {
    expect(defaultOverride(fee, "c1")).toEqual({
      classId: "c1",
      amount: "15000",
      dueDate: "2026-09-01",
      lateFeeAmount: "500",
    });
  });

  it("leaves the due date blank when the fee has none", () => {
    expect(defaultOverride({ ...fee, defaultDueDate: undefined }, "c1").dueDate).toBe("");
  });
});

describe("overrideFor", () => {
  it("prefers what the user typed", () => {
    const overrides: OverrideMap = {
      c1: { classId: "c1", amount: "20000", dueDate: "2026-10-01", lateFeeAmount: "0" },
    };
    expect(overrideFor(overrides, fee, "c1").amount).toBe("20000");
    expect(overrideFor(overrides, fee, "c2").amount).toBe("15000");
  });
});

describe("validateOverrides", () => {
  it("requires at least one class", () => {
    expect(validateOverrides(fee, [], {})).toMatch(/at least one class/i);
  });

  it("accepts classes left on the fee's defaults", () => {
    expect(validateOverrides(fee, ["c1", "c2"], {})).toBeNull();
  });

  it("refuses to assign when a class has no due date", () => {
    const withoutDate = { ...fee, defaultDueDate: undefined };
    expect(validateOverrides(withoutDate, ["c1"], {})).toMatch(/due date/i);
  });

  it("refuses a blank, non-numeric or negative amount", () => {
    const blank: OverrideMap = {
      c1: { classId: "c1", amount: "", dueDate: "2026-09-01", lateFeeAmount: "0" },
    };
    expect(validateOverrides(fee, ["c1"], blank)).toMatch(/amount/i);

    const negative: OverrideMap = {
      c1: { classId: "c1", amount: "-10", dueDate: "2026-09-01", lateFeeAmount: "0" },
    };
    expect(validateOverrides(fee, ["c1"], negative)).toMatch(/negative/i);
  });

  it("refuses a negative late fee", () => {
    const overrides: OverrideMap = {
      c1: { classId: "c1", amount: "100", dueDate: "2026-09-01", lateFeeAmount: "-1" },
    };
    expect(validateOverrides(fee, ["c1"], overrides)).toMatch(/late fee/i);
  });
});

describe("buildAssignPayload", () => {
  it("matches AssignFeeToClassesDto, with numbers as numbers", () => {
    const overrides: OverrideMap = {
      c2: { classId: "c2", amount: "20000", dueDate: "2026-10-01", lateFeeAmount: "1000" },
    };

    const payload = buildAssignPayload(fee, ["c1", "c2"], overrides, {
      academicYearId: "ay-1",
      termId: "t-1",
    });

    expect(payload).toEqual({
      feeItemId: "fi-1",
      academicYearId: "ay-1",
      termId: "t-1",
      classes: [
        {
          classId: "c1",
          amount: 15000,
          dueDate: "2026-09-01",
          lateFeeAmount: 500,
          isVisibleToParents: true,
        },
        {
          classId: "c2",
          amount: 20000,
          dueDate: "2026-10-01",
          lateFeeAmount: 1000,
          isVisibleToParents: true,
        },
      ],
    });
  });

  it("omits an unset academic year and term rather than sending empty ids", () => {
    const payload = buildAssignPayload(fee, ["c1"], {}, { academicYearId: "", termId: "" });
    expect(payload.academicYearId).toBeUndefined();
    expect(payload.termId).toBeUndefined();
  });

  it("never invents a due date", () => {
    const withoutDate = { ...fee, defaultDueDate: undefined };
    expect(buildAssignPayload(withoutDate, ["c1"], {}).classes[0].dueDate).toBe("");
  });
});
