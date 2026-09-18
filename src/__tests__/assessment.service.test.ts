import {
  assessmentService,
  AssessmentHasGradesError,
} from "@/app/services/assessment.service";
import { api, apiClient } from "@/lib/apiClient";
import { ApiError } from "@/lib/apiError";

jest.mock("@/lib/apiClient", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  apiClient: {
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
const mockRawDelete = apiClient.delete as jest.Mock;

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

beforeEach(() => jest.clearAllMocks());

// ─── HTTP methods ─────────────────────────────────────────────────────────────

describe("createAssessment", () => {
  it("posts to /assessments and returns assessment from result.assessment", async () => {
    const assessment = { _id: "a1", name: "Mid Term", status: "pending" };
    mockPost.mockResolvedValueOnce({ assessment });
    const payload = { name: "Mid Term", termId: "tm1", startDate: "2025-10-01", endDate: "2025-10-15" };
    await expect(assessmentService.createAssessment(payload)).resolves.toEqual(assessment);
    expect(mockPost).toHaveBeenCalledWith("/assessments", payload);
  });

  it("propagates the ApiError the client throws", async () => {
    mockPost.mockRejectedValueOnce(new ApiError("NOT_FOUND", "Term not found", 404));
    await expect(
      assessmentService.createAssessment({ name: "X", termId: "tm0", startDate: "", endDate: "" }),
    ).rejects.toThrow("Term not found");
  });
});

describe("getAssessmentsBySchool", () => {
  it("requests with default pagination", async () => {
    mockGet.mockResolvedValueOnce({ assessments: [], pagination: {} });
    await assessmentService.getAssessmentsBySchool();
    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain("page=1");
    expect(url).toContain("limit=10");
  });

  it("uses provided page and limit", async () => {
    mockGet.mockResolvedValueOnce({ assessments: [], pagination: {} });
    await assessmentService.getAssessmentsBySchool(3, 25);
    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain("page=3");
    expect(url).toContain("limit=25");
  });

  it("sends no school id — the API reads it from the token", async () => {
    mockGet.mockResolvedValueOnce({ assessments: [], pagination: {} });
    await assessmentService.getAssessmentsBySchool();
    expect(mockGet.mock.calls[0][0]).not.toContain(":schoolId");
  });
});

describe("getAssessmentsByTerm", () => {
  it("calls the correct endpoint", async () => {
    mockGet.mockResolvedValueOnce([]);
    await assessmentService.getAssessmentsByTerm("tm1");
    expect(mockGet.mock.calls[0][0]).toBe("/assessments/term/tm1");
  });
});

describe("getAssessmentById", () => {
  it("calls the correct endpoint", async () => {
    mockGet.mockResolvedValueOnce({ _id: "a1" });
    await assessmentService.getAssessmentById("a1");
    expect(mockGet.mock.calls[0][0]).toBe("/assessments/a1");
  });
});

describe("updateAssessment", () => {
  it("puts update payload and returns assessment from result.assessment", async () => {
    const updated = { _id: "a1", name: "Final Exam" };
    mockPut.mockResolvedValueOnce({ assessment: updated });
    await expect(assessmentService.updateAssessment("a1", { name: "Final Exam" })).resolves.toEqual(updated);
    expect(mockPut).toHaveBeenCalledWith("/assessments/a1", { name: "Final Exam" });
  });
});

describe("deleteAssessment", () => {
  it("calls delete endpoint", async () => {
    mockRawDelete.mockResolvedValueOnce(response({}));
    await assessmentService.deleteAssessment("a1");
    expect(mockRawDelete.mock.calls[0][0]).toBe("/assessments/a1");
  });

  it("throws an ApiError when delete fails", async () => {
    mockRawDelete.mockResolvedValueOnce(response({ message: "Not found" }, 404));
    await expect(assessmentService.deleteAssessment("a999")).rejects.toThrow("Not found");
  });

  it("throws AssessmentHasGradesError carrying the blocking courses on 409", async () => {
    const coursesWithGrades = [
      { courseName: "Algebra", teacherName: "Ada Lovelace", teacherEmail: "ada@example.com" },
    ];
    mockRawDelete.mockResolvedValueOnce(
      response({ message: "Grades already recorded", coursesWithGrades }, 409),
    );

    await expect(assessmentService.deleteAssessment("a1")).rejects.toMatchObject({
      name: "AssessmentHasGradesError",
      code: "CONFLICT",
      coursesWithGrades,
    });
  });

  it("gives AssessmentHasGradesError an empty list when the body carries none", async () => {
    mockRawDelete.mockResolvedValueOnce(response({ message: "Blocked" }, 409));
    const error = await assessmentService.deleteAssessment("a1").catch((e) => e);
    expect(error).toBeInstanceOf(AssessmentHasGradesError);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.coursesWithGrades).toEqual([]);
  });
});

// ─── Pure utility methods (no mocking needed) ─────────────────────────────────

describe("validateAssessmentDates", () => {
  const futureStart = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const futureEnd = new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0];

  it("returns valid for future start before future end", () => {
    expect(assessmentService.validateAssessmentDates(futureStart, futureEnd)).toEqual({ isValid: true });
  });

  it("rejects when end is before start", () => {
    const result = assessmentService.validateAssessmentDates(futureEnd, futureStart);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/end date must be after start date/i);
  });

  it("rejects when start is in the past", () => {
    const past = "2020-01-01";
    const result = assessmentService.validateAssessmentDates(past, futureEnd);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/start date cannot be in the past/i);
  });

  it("rejects equal start and end dates", () => {
    const result = assessmentService.validateAssessmentDates(futureStart, futureStart);
    expect(result.isValid).toBe(false);
  });
});

describe("formatDateForAPI", () => {
  it("returns an ISO string", () => {
    const result = assessmentService.formatDateForAPI("2025-10-01");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("getStatusColor", () => {
  it("returns correct classes for each status", () => {
    expect(assessmentService.getStatusColor("pending")).toContain("yellow");
    expect(assessmentService.getStatusColor("active")).toContain("blue");
    expect(assessmentService.getStatusColor("completed")).toContain("green");
    expect(assessmentService.getStatusColor("cancelled")).toContain("red");
  });

  it("returns gray for unknown status", () => {
    expect(assessmentService.getStatusColor("unknown")).toContain("gray");
  });

  it("carries a dark-theme variant for every status", () => {
    for (const status of ["pending", "active", "completed", "cancelled", "unknown"]) {
      expect(assessmentService.getStatusColor(status)).toContain("dark:");
    }
  });
});
