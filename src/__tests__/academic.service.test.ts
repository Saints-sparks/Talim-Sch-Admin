import {
  createAcademicYear,
  createTerm,
  dedupeAcademicYearsByName,
  getAcademicYearLabel,
  getAcademicYears,
  getTerms,
  getTimetableEntries,
  setCurrentTerm,
} from "@/app/services/academic.service";
import { api } from "@/lib/apiClient";
import { ApiError } from "@/lib/apiError";

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
const mockPut = api.put as jest.Mock;

/** Rejects the way the typed api facade does on a non-2xx response. */
function apiFailure(message: string, status = 400) {
  return Promise.reject(
    new ApiError(status === 404 ? "NOT_FOUND" : "BAD_REQUEST", message, status)
  );
}

beforeEach(() => jest.clearAllMocks());

// ─── Academic Years ───────────────────────────────────────────────────────────

describe("createAcademicYear", () => {
  it("posts and returns the academicYear object from response", async () => {
    const year = { _id: "y1", year: "2025-2026", startDate: "2025-09-01", endDate: "2026-07-31", schoolId: "sc1", isCurrent: true, createdAt: "", updatedAt: "" };
    mockPost.mockResolvedValueOnce({ message: "Created", academicYear: year });
    await expect(createAcademicYear({ year: "2025-2026", startDate: "2025-09-01", endDate: "2026-07-31", isCurrent: true })).resolves.toEqual(year);
  });

  it("falls back to data property when academicYear is absent", async () => {
    const year = { _id: "y2", year: "2024-2025" };
    mockPost.mockResolvedValueOnce({ data: year });
    await expect(createAcademicYear({ year: "2024-2025", startDate: "", endDate: "", isCurrent: false })).resolves.toEqual(year);
  });

  it("falls back to root object when both academicYear and data are absent", async () => {
    const year = { _id: "y3", year: "2023-2024" };
    mockPost.mockResolvedValueOnce(year);
    await expect(createAcademicYear({ year: "2023-2024", startDate: "", endDate: "", isCurrent: false })).resolves.toEqual(year);
  });

  it("throws on failure", async () => {
    mockPost.mockReturnValueOnce(apiFailure("Year already exists", 409));
    await expect(createAcademicYear({ year: "2025-2026", startDate: "", endDate: "", isCurrent: false })).rejects.toThrow("Year already exists");
  });
});

describe("getAcademicYears", () => {
  it("returns array from academicYears field", async () => {
    const years = [{ _id: "y1", year: "2025-2026" }];
    mockGet.mockResolvedValueOnce({ message: "ok", academicYears: years });
    await expect(getAcademicYears()).resolves.toEqual(years);
  });

  it("falls back to data array when academicYears absent", async () => {
    const years = [{ _id: "y1" }];
    mockGet.mockResolvedValueOnce({ data: years });
    await expect(getAcademicYears()).resolves.toEqual(years);
  });

  it("accepts a bare array body", async () => {
    const years = [{ _id: "y1", year: "2025-2026" }];
    mockGet.mockResolvedValueOnce(years);
    await expect(getAcademicYears()).resolves.toEqual(years);
  });

  it("dedupes academic years with the same display name", async () => {
    const years = [
      { _id: "y1", year: "2024/2025", isCurrent: false },
      { _id: "y2", year: "2024/2025", isCurrent: true },
      { _id: "y3", year: "2026/2026", isCurrent: false },
    ];
    mockGet.mockResolvedValueOnce({ academicYears: years });
    await expect(getAcademicYears()).resolves.toEqual([years[1], years[2]]);
  });

  it("returns empty array when response is not an array", async () => {
    mockGet.mockResolvedValueOnce(null);
    await expect(getAcademicYears()).resolves.toEqual([]);
  });

  it("throws on network failure", async () => {
    mockGet.mockReturnValueOnce(apiFailure("Internal error", 500));
    await expect(getAcademicYears()).rejects.toThrow("Internal error");
  });
});

describe("academic year helpers", () => {
  it("uses year, name, then id as the academic year label", () => {
    expect(getAcademicYearLabel({ _id: "y1", year: "2024/2025", name: "Old label" })).toBe("2024/2025");
    expect(getAcademicYearLabel({ _id: "y2", name: "2025/2026" })).toBe("2025/2026");
    expect(getAcademicYearLabel({ _id: "y3" })).toBe("y3");
  });

  it("keeps one item for repeated academic year names", () => {
    expect(
      dedupeAcademicYearsByName([
        { _id: "y1", name: "2024/2025" },
        { _id: "y2", year: "2024/2025", isCurrent: true },
        { _id: "y3", name: "2026/2026" },
      ])
    ).toEqual([
      { _id: "y2", year: "2024/2025", isCurrent: true },
      { _id: "y3", name: "2026/2026" },
    ]);
  });
});

// ─── Terms ────────────────────────────────────────────────────────────────────

describe("createTerm", () => {
  it("posts term and maps response fields", async () => {
    const raw = { _id: "tm1", name: "Term 1", startDate: "2025-09-01", endDate: "2025-12-31", academicYearId: "y1", isCurrent: false, schoolId: "sc1", createdAt: "2025-01-01", updatedAt: "2025-01-01" };
    mockPost.mockResolvedValueOnce(raw);
    const result = await createTerm({ name: "Term 1", startDate: "2025-09-01", endDate: "2025-12-31", isCurrent: false, academicYearId: "y1" });
    expect(result._id).toBe("tm1");
    expect(result.name).toBe("Term 1");
    expect(result.academicYearId).toBe("y1");
  });

  it("trims the term name and sends only DTO fields", async () => {
    mockPost.mockResolvedValueOnce({ message: "Term created successfully" });
    await createTerm({ name: "  First Term  ", startDate: "2025-09-01", endDate: "2025-12-31", isCurrent: true, academicYearId: "y1" });
    expect(mockPost.mock.calls[0][1]).toEqual({
      academicYearId: "y1",
      name: "First Term",
      startDate: "2025-09-01",
      endDate: "2025-12-31",
      isCurrent: true,
    });
  });

  it("throws on failure", async () => {
    mockPost.mockReturnValueOnce(apiFailure("Term creation failed"));
    await expect(createTerm({ name: "T", startDate: "", endDate: "", isCurrent: false, academicYearId: "" })).rejects.toThrow("Term creation failed");
  });
});

describe("getTerms", () => {
  it("returns terms array from response", async () => {
    const terms = [{ _id: "tm1", name: "Term 1" }];
    mockGet.mockResolvedValueOnce({ terms });
    await expect(getTerms()).resolves.toEqual(terms);
  });

  it("returns empty array when terms field is missing", async () => {
    mockGet.mockResolvedValueOnce({});
    await expect(getTerms()).resolves.toEqual([]);
  });

  it("returns empty array when the body is null", async () => {
    mockGet.mockResolvedValueOnce(null);
    await expect(getTerms()).resolves.toEqual([]);
  });
});

// ─── setCurrentTerm ───────────────────────────────────────────────────────────

describe("setCurrentTerm", () => {
  it("calls PUT on the set-current endpoint", async () => {
    mockPut.mockResolvedValueOnce({ message: "updated" });
    await setCurrentTerm("tm1");
    const calledUrl = mockPut.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/term/tm1/set-current");
  });

  it("throws on failure", async () => {
    mockPut.mockReturnValueOnce(apiFailure("Term not found", 404));
    await expect(setCurrentTerm("tm999")).rejects.toThrow("Term not found");
  });
});

// ─── Timetable ────────────────────────────────────────────────────────────────

describe("getTimetableEntries", () => {
  it("returns the day-keyed timetable body", async () => {
    const body = { Monday: [{ time: "08:00 - 09:00", startTime: "08:00", endTime: "09:00" }] };
    mockGet.mockResolvedValueOnce(body);
    await expect(getTimetableEntries()).resolves.toEqual(body);
  });

  it("throws when the timetable request fails", async () => {
    mockGet.mockReturnValueOnce(apiFailure("No timetable found", 404));
    await expect(getTimetableEntries()).rejects.toThrow("No timetable found");
  });
});
