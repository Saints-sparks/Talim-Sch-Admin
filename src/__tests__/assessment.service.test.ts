import { assessmentService } from "@/app/services/assessment.service";
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
const mockDelete = apiClient.delete as jest.Mock;

function ok(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200 });
}
function err(message: string, status = 400) {
  return new Response(JSON.stringify({ message }), { status });
}

beforeEach(() => jest.clearAllMocks());

// ─── HTTP methods ─────────────────────────────────────────────────────────────

describe("createAssessment", () => {
  it("posts to /assessments and returns assessment from result.assessment", async () => {
    const assessment = { _id: "a1", name: "Mid Term", status: "pending" };
    mockPost.mockResolvedValueOnce(ok({ assessment }));
    const payload = { name: "Mid Term", termId: "tm1", startDate: "2025-10-01", endDate: "2025-10-15" };
    await expect(assessmentService.createAssessment(payload)).resolves.toEqual(assessment);
  });

  it("throws on server error", async () => {
    mockPost.mockResolvedValueOnce(err("Term not found", 404));
    await expect(assessmentService.createAssessment({ name: "X", termId: "tm0", startDate: "", endDate: "" })).rejects.toThrow("Term not found");
  });
});

describe("getAssessmentsBySchool", () => {
  it("requests with default pagination", async () => {
    mockGet.mockResolvedValueOnce(ok({ assessments: [], pagination: {} }));
    await assessmentService.getAssessmentsBySchool();
    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain("page=1");
    expect(url).toContain("limit=10");
  });

  it("uses provided page and limit", async () => {
    mockGet.mockResolvedValueOnce(ok({ assessments: [], pagination: {} }));
    await assessmentService.getAssessmentsBySchool(3, 25);
    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain("page=3");
    expect(url).toContain("limit=25");
  });
});

describe("getAssessmentsByTerm", () => {
  it("calls the correct endpoint", async () => {
    mockGet.mockResolvedValueOnce(ok([]));
    await assessmentService.getAssessmentsByTerm("tm1");
    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain("/assessments/term/tm1");
  });
});

describe("getAssessmentById", () => {
  it("calls the correct endpoint", async () => {
    mockGet.mockResolvedValueOnce(ok({ _id: "a1" }));
    await assessmentService.getAssessmentById("a1");
    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain("/assessments/a1");
  });
});

describe("updateAssessment", () => {
  it("puts update payload and returns assessment from result.assessment", async () => {
    const updated = { _id: "a1", name: "Final Exam" };
    mockPut.mockResolvedValueOnce(ok({ assessment: updated }));
    await expect(assessmentService.updateAssessment("a1", { name: "Final Exam" })).resolves.toEqual(updated);
  });
});

describe("deleteAssessment", () => {
  it("calls delete endpoint", async () => {
    mockDelete.mockResolvedValueOnce(ok({}));
    await assessmentService.deleteAssessment("a1");
    const url = mockDelete.mock.calls[0][0] as string;
    expect(url).toContain("/assessments/a1");
  });

  it("throws when delete fails", async () => {
    mockDelete.mockResolvedValueOnce(err("Not found", 404));
    await expect(assessmentService.deleteAssessment("a999")).rejects.toThrow("Not found");
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
});
