import {
  createAcademicYear,
  createTerm,
  getAcademicYears,
  getTerms,
  setCurrentTerm,
} from "@/app/services/academic.service";
import { apiClient } from "@/lib/apiClient";

jest.mock("@/lib/apiClient", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockPut = apiClient.put as jest.Mock;

function ok(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200 });
}
function err(message: string, status = 400) {
  return new Response(JSON.stringify({ message }), { status });
}

beforeEach(() => jest.clearAllMocks());

// ─── Academic Years ───────────────────────────────────────────────────────────

describe("createAcademicYear", () => {
  it("posts and returns the academicYear object from response", async () => {
    const year = { _id: "y1", year: "2025-2026", startDate: "2025-09-01", endDate: "2026-07-31", schoolId: "sc1", isCurrent: true, createdAt: "", updatedAt: "" };
    mockPost.mockResolvedValueOnce(ok({ message: "Created", academicYear: year }));
    await expect(createAcademicYear({ year: "2025-2026", startDate: "2025-09-01", endDate: "2026-07-31", isCurrent: true })).resolves.toEqual(year);
  });

  it("falls back to data property when academicYear is absent", async () => {
    const year = { _id: "y2", year: "2024-2025" };
    mockPost.mockResolvedValueOnce(ok({ data: year }));
    await expect(createAcademicYear({ year: "2024-2025", startDate: "", endDate: "", isCurrent: false })).resolves.toEqual(year);
  });

  it("falls back to root object when both academicYear and data are absent", async () => {
    const year = { _id: "y3", year: "2023-2024" };
    mockPost.mockResolvedValueOnce(ok(year));
    await expect(createAcademicYear({ year: "2023-2024", startDate: "", endDate: "", isCurrent: false })).resolves.toEqual(year);
  });

  it("throws on failure", async () => {
    mockPost.mockResolvedValueOnce(err("Year already exists", 409));
    await expect(createAcademicYear({ year: "2025-2026", startDate: "", endDate: "", isCurrent: false })).rejects.toThrow();
  });
});

describe("getAcademicYears", () => {
  it("returns array from academicYears field", async () => {
    const years = [{ _id: "y1", year: "2025-2026" }];
    mockGet.mockResolvedValueOnce(ok({ message: "ok", academicYears: years }));
    await expect(getAcademicYears()).resolves.toEqual(years);
  });

  it("falls back to data array when academicYears absent", async () => {
    const years = [{ _id: "y1" }];
    mockGet.mockResolvedValueOnce(ok({ data: years }));
    await expect(getAcademicYears()).resolves.toEqual(years);
  });

  it("returns empty array when response is not an array", async () => {
    mockGet.mockResolvedValueOnce(ok(null));
    await expect(getAcademicYears()).resolves.toEqual([]);
  });

  it("throws on network failure", async () => {
    mockGet.mockResolvedValueOnce(err("Internal error", 500));
    await expect(getAcademicYears()).rejects.toThrow();
  });
});

// ─── Terms ────────────────────────────────────────────────────────────────────

describe("createTerm", () => {
  it("posts term and maps response fields", async () => {
    const raw = { _id: "tm1", name: "Term 1", startDate: "2025-09-01", endDate: "2025-12-31", academicYearId: "y1", isCurrent: false, schoolId: "sc1", createdAt: "2025-01-01", updatedAt: "2025-01-01" };
    mockPost.mockResolvedValueOnce(ok(raw));
    const result = await createTerm({ name: "Term 1", startDate: "2025-09-01", endDate: "2025-12-31", isCurrent: false, academicYearId: "y1" });
    expect(result._id).toBe("tm1");
    expect(result.name).toBe("Term 1");
    expect(result.academicYearId).toBe("y1");
  });

  it("throws on failure", async () => {
    mockPost.mockResolvedValueOnce(err("Term creation failed"));
    await expect(createTerm({ name: "T", startDate: "", endDate: "", isCurrent: false, academicYearId: "" })).rejects.toThrow();
  });
});

describe("getTerms", () => {
  it("returns terms array from response", async () => {
    const terms = [{ _id: "tm1", name: "Term 1" }];
    mockGet.mockResolvedValueOnce(ok({ terms }));
    await expect(getTerms()).resolves.toEqual(terms);
  });

  it("returns empty array when terms field is missing", async () => {
    mockGet.mockResolvedValueOnce(ok({}));
    await expect(getTerms()).resolves.toEqual([]);
  });
});

// ─── setCurrentTerm ───────────────────────────────────────────────────────────

describe("setCurrentTerm", () => {
  it("calls PUT on the set-current endpoint", async () => {
    mockPut.mockResolvedValueOnce(ok({ message: "updated" }));
    await setCurrentTerm("tm1");
    const calledUrl = mockPut.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/term/tm1/set-current");
  });

  it("throws on failure", async () => {
    mockPut.mockResolvedValueOnce(err("Term not found", 404));
    await expect(setCurrentTerm("tm999")).rejects.toThrow();
  });
});
