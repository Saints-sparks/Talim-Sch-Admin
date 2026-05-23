import {
  getTransitDashboard,
  listTransfers,
  getTransfer,
  createTransfer,
  sourceApproveTransfer,
  targetApproveTransfer,
  acceptTransfer,
  rejectTransfer,
  cancelTransfer,
  getStudentSnapshot,
  listPromotionRuns,
  getPromotionRun,
  createPromotionRun,
  validatePromotionRun,
  commitPromotionRun,
  cancelPromotionRun,
  createEnrollment,
  getStudentEnrollmentHistory,
  searchSchools,
  getPreCloseSummary,
} from "@/app/services/transit.service";
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

function okResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200 });
}

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ message }), { status });
}

beforeEach(() => jest.clearAllMocks());

// ─── Dashboard ────────────────────────────────────────────────────────────────

describe("getTransitDashboard", () => {
  it("returns dashboard data", async () => {
    const data = { pendingIncoming: 2, pendingOutgoing: 1, openPromotionRuns: 0, studentsWithoutEnrollment: 5, totalActiveEnrollments: 120 };
    mockGet.mockResolvedValueOnce(okResponse(data));
    await expect(getTransitDashboard()).resolves.toEqual(data);
    expect(mockGet).toHaveBeenCalledWith("/transit/dashboard");
  });

  it("throws on error response", async () => {
    mockGet.mockResolvedValueOnce(errorResponse("Server error", 500));
    await expect(getTransitDashboard()).rejects.toThrow("Server error");
  });
});

// ─── Transfers ────────────────────────────────────────────────────────────────

describe("listTransfers", () => {
  it("fetches without status filter", async () => {
    mockGet.mockResolvedValueOnce(okResponse([]));
    await listTransfers();
    expect(mockGet).toHaveBeenCalledWith("/transit/transfers");
  });

  it("appends status query param when provided", async () => {
    mockGet.mockResolvedValueOnce(okResponse([]));
    await listTransfers("accepted");
    expect(mockGet).toHaveBeenCalledWith("/transit/transfers?status=accepted");
  });

  it("returns transfer array", async () => {
    const transfers = [{ _id: "t1", status: "requested" }];
    mockGet.mockResolvedValueOnce(okResponse(transfers));
    await expect(listTransfers()).resolves.toEqual(transfers);
  });
});

describe("getTransfer", () => {
  it("calls the correct endpoint", async () => {
    mockGet.mockResolvedValueOnce(okResponse({ _id: "t1" }));
    await getTransfer("t1");
    expect(mockGet).toHaveBeenCalledWith("/transit/transfers/t1");
  });
});

describe("createTransfer", () => {
  it("posts payload and returns transfer", async () => {
    const payload = { studentId: "s1", targetClassId: "c1", targetAcademicYearId: "y1" };
    const created = { _id: "t2", ...payload, status: "requested" };
    mockPost.mockResolvedValueOnce(okResponse(created));
    await expect(createTransfer(payload)).resolves.toEqual(created);
    expect(mockPost).toHaveBeenCalledWith("/transit/transfers", payload);
  });

  it("throws with backend error message", async () => {
    const payload = { studentId: "s1", targetClassId: "c1", targetAcademicYearId: "y1" };
    mockPost.mockResolvedValueOnce(errorResponse("Student not found", 404));
    await expect(createTransfer(payload)).rejects.toThrow("Student not found");
  });
});

describe("transfer action endpoints", () => {
  const id = "t1";

  it("sourceApproveTransfer calls correct endpoint", async () => {
    mockPost.mockResolvedValueOnce(okResponse({ _id: id }));
    await sourceApproveTransfer(id);
    expect(mockPost).toHaveBeenCalledWith(`/transit/transfers/${id}/source-approve`);
  });

  it("targetApproveTransfer calls correct endpoint", async () => {
    mockPost.mockResolvedValueOnce(okResponse({ _id: id }));
    await targetApproveTransfer(id);
    expect(mockPost).toHaveBeenCalledWith(`/transit/transfers/${id}/target-approve`);
  });

  it("acceptTransfer calls correct endpoint", async () => {
    mockPost.mockResolvedValueOnce(okResponse({ _id: id }));
    await acceptTransfer(id);
    expect(mockPost).toHaveBeenCalledWith(`/transit/transfers/${id}/accept`);
  });

  it("rejectTransfer passes reason in body", async () => {
    mockPost.mockResolvedValueOnce(okResponse({ _id: id }));
    await rejectTransfer(id, "Not eligible");
    expect(mockPost).toHaveBeenCalledWith(`/transit/transfers/${id}/reject`, { reason: "Not eligible" });
  });

  it("cancelTransfer passes reason in body", async () => {
    mockPost.mockResolvedValueOnce(okResponse({ _id: id }));
    await cancelTransfer(id, "Mistake");
    expect(mockPost).toHaveBeenCalledWith(`/transit/transfers/${id}/cancel`, { reason: "Mistake" });
  });
});

// ─── Promotions ───────────────────────────────────────────────────────────────

describe("listPromotionRuns", () => {
  it("fetches without filter", async () => {
    mockGet.mockResolvedValueOnce(okResponse([]));
    await listPromotionRuns();
    expect(mockGet).toHaveBeenCalledWith("/transit/promotions");
  });

  it("appends status filter", async () => {
    mockGet.mockResolvedValueOnce(okResponse([]));
    await listPromotionRuns("committed");
    expect(mockGet).toHaveBeenCalledWith("/transit/promotions?status=committed");
  });
});

describe("getPromotionRun", () => {
  it("calls correct endpoint", async () => {
    mockGet.mockResolvedValueOnce(okResponse({ _id: "p1" }));
    await getPromotionRun("p1");
    expect(mockGet).toHaveBeenCalledWith("/transit/promotions/p1");
  });
});

describe("createPromotionRun", () => {
  it("posts decisions and returns run", async () => {
    const payload = {
      fromAcademicYearId: "y1",
      toAcademicYearId: "y2",
      decisions: [{ studentId: "s1", fromClassId: "c1", toClassId: "c2" }],
    };
    const run = { _id: "p1", status: "draft", ...payload };
    mockPost.mockResolvedValueOnce(okResponse(run));
    await expect(createPromotionRun(payload)).resolves.toEqual(run);
  });
});

describe("validatePromotionRun", () => {
  it("posts to validate endpoint", async () => {
    mockPost.mockResolvedValueOnce(okResponse({ _id: "p1", status: "validated" }));
    await validatePromotionRun("p1");
    expect(mockPost).toHaveBeenCalledWith("/transit/promotions/p1/validate");
  });
});

describe("commitPromotionRun", () => {
  it("posts to commit endpoint and returns updated run", async () => {
    const run = { _id: "p1", status: "committed" };
    mockPost.mockResolvedValueOnce(okResponse(run));
    await expect(commitPromotionRun("p1")).resolves.toEqual(run);
    expect(mockPost).toHaveBeenCalledWith("/transit/promotions/p1/commit");
  });
});

describe("cancelPromotionRun", () => {
  it("posts to cancel endpoint", async () => {
    mockPost.mockResolvedValueOnce(okResponse({ _id: "p1", status: "cancelled" }));
    await cancelPromotionRun("p1");
    expect(mockPost).toHaveBeenCalledWith("/transit/promotions/p1/cancel");
  });
});

// ─── Enrollments ──────────────────────────────────────────────────────────────

describe("createEnrollment", () => {
  it("posts payload and returns enrollment", async () => {
    const payload = { studentId: "s1", classId: "c1", academicYearId: "y1" };
    const enrollment = { _id: "e1", status: "active", source: "manual", ...payload };
    mockPost.mockResolvedValueOnce(okResponse(enrollment));
    await expect(createEnrollment(payload)).resolves.toEqual(enrollment);
    expect(mockPost).toHaveBeenCalledWith("/transit/enrollments", payload);
  });

  it("throws conflict error when student already active", async () => {
    mockPost.mockResolvedValueOnce(errorResponse("Student already has an active enrollment", 409));
    await expect(createEnrollment({ studentId: "s1", classId: "c1", academicYearId: "y1" }))
      .rejects.toThrow("Student already has an active enrollment");
  });

  it("includes optional termId and source", async () => {
    const payload = { studentId: "s1", classId: "c1", academicYearId: "y1", termId: "tm1", source: "manual" };
    mockPost.mockResolvedValueOnce(okResponse({ _id: "e2", ...payload }));
    await createEnrollment(payload);
    expect(mockPost).toHaveBeenCalledWith("/transit/enrollments", payload);
  });
});

describe("getStudentEnrollmentHistory", () => {
  it("calls correct endpoint", async () => {
    mockGet.mockResolvedValueOnce(okResponse([]));
    await getStudentEnrollmentHistory("s1");
    expect(mockGet).toHaveBeenCalledWith("/transit/students/s1/enrollments");
  });

  it("returns array of enrollments", async () => {
    const history = [{ _id: "e1", status: "inactive" }, { _id: "e2", status: "active" }];
    mockGet.mockResolvedValueOnce(okResponse(history));
    await expect(getStudentEnrollmentHistory("s1")).resolves.toEqual(history);
  });
});

// ─── Student Snapshot ─────────────────────────────────────────────────────────

describe("getStudentSnapshot", () => {
  it("calls correct endpoint", async () => {
    mockGet.mockResolvedValueOnce(okResponse({ student: { _id: "s1" } }));
    await getStudentSnapshot("s1");
    expect(mockGet).toHaveBeenCalledWith("/transit/students/s1/snapshot");
  });
});

// ─── Academic Year Closure ────────────────────────────────────────────────────

describe("getPreCloseSummary", () => {
  it("calls correct endpoint and returns summary", async () => {
    const summary = { canClose: true, blockers: [], classCount: 5, activeEnrollmentCount: 100, attendanceRecordCount: 200, assessmentGradeRecordCount: 50, courseGradeRecordCount: 50 };
    mockGet.mockResolvedValueOnce(okResponse(summary));
    await expect(getPreCloseSummary("y1")).resolves.toEqual(summary);
    expect(mockGet).toHaveBeenCalledWith("/transit/academic-years/y1/pre-close-summary");
  });

  it("throws when canClose is blocked", async () => {
    mockGet.mockResolvedValueOnce(errorResponse("Cannot close year", 422));
    await expect(getPreCloseSummary("y1")).rejects.toThrow("Cannot close year");
  });
});

// ─── School Search ────────────────────────────────────────────────────────────

describe("searchSchools", () => {
  it("encodes query and calls endpoint", async () => {
    mockGet.mockResolvedValueOnce(okResponse([]));
    await searchSchools("Green Valley");
    expect(mockGet).toHaveBeenCalledWith("/schools/search?q=Green%20Valley");
  });

  it("returns school results", async () => {
    const schools = [{ _id: "sc1", name: "Green Valley School" }];
    mockGet.mockResolvedValueOnce(okResponse(schools));
    await expect(searchSchools("green")).resolves.toEqual(schools);
  });
});
