/** @jest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
import { toast } from "@/components/CustomToast";
import {
  EMPTY_TERM,
  EMPTY_YEAR,
  formatSetupDate,
  toTermPayload,
  toYearPayload,
  validateTermForm,
  validateYearForm,
} from "@/components/settings/academic/academicForms";
import { useAcademicSetupForms } from "@/components/settings/academic/useAcademicSetupForms";

jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const validYear = { year: "2027/2028", startDate: "2027-09-01", endDate: "2028-07-01", isCurrent: true };
const validTerm = {
  name: "First Term",
  startDate: "2027-09-01",
  endDate: "2027-12-15",
  isCurrent: false,
  academicYearId: "y1",
};

describe("formatSetupDate", () => {
  it("prints a dash for an absent date", () => {
    expect(formatSetupDate("")).toBe("—");
  });

  it("prints day, short month and year", () => {
    expect(formatSetupDate("2025-09-01T12:00:00.000Z")).toMatch(/^01 Sept? 2025$/);
  });
});

describe("validateYearForm", () => {
  it("accepts a complete new year", () => {
    expect(validateYearForm(validYear, [{ year: "2026/2027" }])).toBeNull();
  });

  it("checks the label, the dates, their order and duplicates, in that order", () => {
    expect(validateYearForm({ ...validYear, year: "  " }, [])).toBe("Academic year is required");
    expect(validateYearForm({ ...validYear, endDate: "" }, [])).toBe("Dates are required");
    expect(validateYearForm({ ...validYear, endDate: validYear.startDate }, [])).toBe(
      "End date must be after start date",
    );
    expect(validateYearForm({ ...validYear, year: " 2026/2027 " }, [{ year: "2026/2027" }])).toBe(
      "Academic year already exists",
    );
  });
});

describe("validateTermForm", () => {
  it("accepts a complete term", () => {
    expect(validateTermForm(validTerm)).toBeNull();
  });

  it("checks the name, the year, the dates and their order", () => {
    expect(validateTermForm({ ...validTerm, name: " " })).toBe("Term name is required");
    expect(validateTermForm({ ...validTerm, academicYearId: "" })).toBe("Academic year is required");
    expect(validateTermForm({ ...validTerm, startDate: "" })).toBe("Dates are required");
    expect(validateTermForm({ ...validTerm, endDate: "2027-08-01" })).toBe("End date must be after start date");
  });
});

describe("payloads", () => {
  it("sends the year label trimmed and the dates as ISO instants", () => {
    expect(toYearPayload({ ...validYear, year: " 2027/2028 " })).toEqual({
      year: "2027/2028",
      startDate: new Date("2027-09-01").toISOString(),
      endDate: new Date("2028-07-01").toISOString(),
      isCurrent: true,
    });
  });

  it("sends the term as typed with the name trimmed", () => {
    expect(toTermPayload({ ...validTerm, name: " First Term " })).toEqual(validTerm);
  });
});

describe("useAcademicSetupForms", () => {
  const actions = () => ({
    addYear: jest.fn().mockResolvedValue({}),
    addTerm: jest.fn().mockResolvedValue({}),
    makeTermCurrent: jest.fn().mockResolvedValue(undefined),
  });
  const submitEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent;

  beforeEach(() => jest.clearAllMocks());

  it("toasts a validation problem and sends nothing", async () => {
    const a = actions();
    const { result } = renderHook(() => useAcademicSetupForms([], a));
    await act(async () => {
      await result.current.submitYear(submitEvent);
    });
    expect(toast.error).toHaveBeenCalledWith("Academic year is required");
    expect(a.addYear).not.toHaveBeenCalled();
  });

  it("creates a year, then clears and closes the form", async () => {
    const a = actions();
    const { result } = renderHook(() => useAcademicSetupForms([], a));
    act(() => {
      result.current.toggleYearForm();
      result.current.setYearForm(validYear);
    });
    expect(result.current.showYearForm).toBe(true);
    await act(async () => {
      await result.current.submitYear(submitEvent);
    });
    expect(a.addYear).toHaveBeenCalledWith(expect.objectContaining({ year: "2027/2028" }));
    expect(result.current.yearForm).toEqual(EMPTY_YEAR);
    expect(result.current.showYearForm).toBe(false);
  });

  it("keeps the typed term when the request fails", async () => {
    const a = actions();
    a.addTerm.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useAcademicSetupForms([], a));
    act(() => {
      result.current.toggleTermForm();
      result.current.setTermForm(validTerm);
    });
    await act(async () => {
      await result.current.submitTerm(submitEvent);
    });
    expect(result.current.termForm).toEqual(validTerm);
    expect(result.current.showTermForm).toBe(true);
    expect(EMPTY_TERM.name).toBe("");
  });

  it("confirms a term change and closes the dialog even when it fails", async () => {
    const a = actions();
    a.makeTermCurrent.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useAcademicSetupForms([], a));
    act(() => result.current.askToChangeTerm("t2"));
    expect(result.current.pendingTermId).toBe("t2");
    await act(async () => {
      await result.current.confirmTermChange();
    });
    expect(a.makeTermCurrent).toHaveBeenCalledWith("t2");
    expect(result.current.pendingTermId).toBe("");
  });
});
