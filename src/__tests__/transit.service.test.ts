import {
  acceptTransfer,
  buildBulkDecisions,
  canCommit,
  cancelPromotionRun,
  cancelTransfer,
  classLabel,
  closeAcademicYear,
  commitPromotionRun,
  createEnrollment,
  createPromotionRun,
  createTransfer,
  getPreCloseSummary,
  getPromotionRun,
  getStudentEnrollmentHistory,
  getStudentSnapshot,
  getTransfer,
  getTransitDashboard,
  getValidationSummary,
  isRunEditable,
  listEnrollments,
  listPromotionRuns,
  listTransfers,
  promotionErrors,
  promotionWarnings,
  refId,
  refLabel,
  rejectTransfer,
  searchSchools,
  sourceApproveTransfer,
  studentLabel,
  targetApproveTransfer,
  transferAbilities,
  validatePromotionRun,
  type PromotionRun,
  type TransferRequest,
  type TransferStatus,
} from "@/app/services/transit.service";
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

beforeEach(() => jest.clearAllMocks());

// ─── Dashboard ────────────────────────────────────────────────────────────────

describe("getTransitDashboard", () => {
  it("flattens the grouped counters the API returns", async () => {
    mockGet.mockResolvedValueOnce({
      currentAcademicYear: { id: "y1", year: "2024/2025", status: "active" },
      transfers: { pendingIncoming: 2, pendingOutgoing: 1 },
      promotions: { openRuns: 3 },
      enrollments: { totalActive: 120, studentsWithoutEnrollment: 5 },
    });

    await expect(getTransitDashboard()).resolves.toEqual({
      pendingIncoming: 2,
      pendingOutgoing: 1,
      openPromotionRuns: 3,
      totalActiveEnrollments: 120,
      studentsWithoutEnrollment: 5,
      currentAcademicYear: { id: "y1", year: "2024/2025", status: "active" },
    });
    expect(mockGet).toHaveBeenCalledWith("/transit/dashboard");
  });

  it("reports zeroes rather than undefined when a group is missing", async () => {
    mockGet.mockResolvedValueOnce({});
    const dashboard = await getTransitDashboard();
    expect(dashboard.pendingIncoming).toBe(0);
    expect(dashboard.openPromotionRuns).toBe(0);
    expect(dashboard.currentAcademicYear).toBeNull();
  });

  it("propagates the ApiError so the page can key on its code", async () => {
    mockGet.mockRejectedValueOnce(new ApiError("SERVICE_UNAVAILABLE", "Down", 503));
    await expect(getTransitDashboard()).rejects.toBeInstanceOf(ApiError);
  });
});

// ─── Transfers ────────────────────────────────────────────────────────────────

describe("listTransfers", () => {
  it("passes the status filter to the API", async () => {
    mockGet.mockResolvedValueOnce([]);
    await listTransfers("source_approved");
    expect(mockGet).toHaveBeenCalledWith("/transit/transfers?status=source_approved");
  });

  it("omits the query string when no status is given", async () => {
    mockGet.mockResolvedValueOnce([]);
    await listTransfers();
    expect(mockGet).toHaveBeenCalledWith("/transit/transfers");
  });

  it("returns an array even when the API sends something else", async () => {
    mockGet.mockResolvedValueOnce(null);
    await expect(listTransfers()).resolves.toEqual([]);
  });
});

describe("transfer reads and transitions", () => {
  it("reads one transfer", async () => {
    mockGet.mockResolvedValueOnce({ _id: "t1" });
    await expect(getTransfer("t1")).resolves.toEqual({ _id: "t1" });
    expect(mockGet).toHaveBeenCalledWith("/transit/transfers/t1");
  });

  it("creates a push request with the source initiator", async () => {
    mockPost.mockResolvedValueOnce({ _id: "t1" });
    await createTransfer({ studentId: "s1", targetSchoolId: "sch2", initiatedBy: "source" });
    expect(mockPost).toHaveBeenCalledWith("/transit/transfers", {
      studentId: "s1",
      targetSchoolId: "sch2",
      initiatedBy: "source",
    });
  });

  it("posts each transition to the endpoint that governs it", async () => {
    mockPost.mockResolvedValue({ _id: "t1" });

    await sourceApproveTransfer("t1");
    expect(mockPost).toHaveBeenCalledWith("/transit/transfers/t1/source-approve");

    await targetApproveTransfer("t1");
    expect(mockPost).toHaveBeenCalledWith("/transit/transfers/t1/target-approve");

    await acceptTransfer("t1");
    expect(mockPost).toHaveBeenCalledWith("/transit/transfers/t1/accept");

    await rejectTransfer("t1", "No space");
    expect(mockPost).toHaveBeenCalledWith("/transit/transfers/t1/reject", { reason: "No space" });

    await cancelTransfer("t1");
    expect(mockPost).toHaveBeenCalledWith("/transit/transfers/t1/cancel", { reason: undefined });
  });

  it("surfaces the API's refusal of an out-of-order transition", async () => {
    mockPost.mockRejectedValueOnce(
      new ApiError("BAD_REQUEST", "The source school must approve the release first", 400)
    );
    await expect(targetApproveTransfer("t1")).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "The source school must approve the release first",
    });
  });
});

// ─── Transfer state machine ───────────────────────────────────────────────────

const SOURCE = "school-source";
const TARGET = "school-target";

function transfer(overrides: Partial<TransferRequest> = {}): TransferRequest {
  return {
    _id: "t1",
    studentId: "s1",
    sourceSchoolId: { _id: SOURCE, name: "Source High" },
    targetSchoolId: { _id: TARGET, name: "Target High" },
    status: "requested",
    initiatedBy: "target",
    documents: [],
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("transferAbilities", () => {
  it("grants nothing without a transfer or a school", () => {
    expect(transferAbilities(null, SOURCE).canSourceApprove).toBe(false);
    expect(transferAbilities(transfer(), null).isSource).toBe(false);
    expect(transferAbilities(transfer(), undefined).canReject).toBe(false);
  });

  it("names the side the signed-in school is on", () => {
    expect(transferAbilities(transfer(), SOURCE)).toMatchObject({ isSource: true, isTarget: false });
    expect(transferAbilities(transfer(), TARGET)).toMatchObject({ isSource: false, isTarget: true });
  });

  it("grants a bystander school nothing at all", () => {
    const abilities = transferAbilities(transfer({ status: "source_approved" }), "school-other");
    expect(abilities).toMatchObject({
      isSource: false,
      isTarget: false,
      canSourceApprove: false,
      canTargetApprove: false,
      canAccept: false,
      canReject: false,
      canCancel: false,
    });
  });

  it("lets only the source school release a requested transfer", () => {
    const requested = transfer({ status: "requested" });
    expect(transferAbilities(requested, SOURCE).canSourceApprove).toBe(true);
    expect(transferAbilities(requested, TARGET).canSourceApprove).toBe(false);
  });

  it("makes the target school wait for the release before approving", () => {
    const requested = transfer({ status: "requested" });
    expect(transferAbilities(requested, TARGET).canTargetApprove).toBe(false);
    expect(transferAbilities(requested, TARGET).waitingOnOtherSchool).toBe(true);

    const released = transfer({ status: "source_approved", sourceApprovedAt: "2025-01-02" });
    expect(transferAbilities(released, TARGET).canTargetApprove).toBe(true);
    expect(transferAbilities(released, SOURCE).canTargetApprove).toBe(false);
    expect(transferAbilities(released, SOURCE).waitingOnOtherSchool).toBe(true);
  });

  it("lets only the target school accept, and only once it is target-approved", () => {
    const approved = transfer({ status: "target_approved", sourceApprovedAt: "2025-01-02" });
    expect(transferAbilities(approved, TARGET).canAccept).toBe(true);
    expect(transferAbilities(approved, SOURCE).canAccept).toBe(false);

    const released = transfer({ status: "source_approved", sourceApprovedAt: "2025-01-02" });
    expect(transferAbilities(released, TARGET).canAccept).toBe(false);
  });

  it("refuses acceptance of a transfer the source school never released", () => {
    const legacy = transfer({ status: "target_approved" });
    expect(transferAbilities(legacy, TARGET).canAccept).toBe(false);
    // …and offers the source school the release instead, as the API still does.
    expect(transferAbilities(legacy, SOURCE).canSourceApprove).toBe(true);
  });

  it("lets only the target school reject, from any open status", () => {
    const open: TransferStatus[] = ["requested", "source_approved", "target_approved"];
    for (const status of open) {
      expect(transferAbilities(transfer({ status }), TARGET).canReject).toBe(true);
      expect(transferAbilities(transfer({ status }), SOURCE).canReject).toBe(false);
    }
    for (const status of ["accepted", "rejected", "cancelled"] as TransferStatus[]) {
      expect(transferAbilities(transfer({ status }), TARGET).canReject).toBe(false);
    }
  });

  it("lets only the source school cancel, and not after the target approved", () => {
    expect(transferAbilities(transfer({ status: "requested" }), SOURCE).canCancel).toBe(true);
    expect(transferAbilities(transfer({ status: "source_approved" }), SOURCE).canCancel).toBe(true);
    expect(transferAbilities(transfer({ status: "target_approved" }), SOURCE).canCancel).toBe(false);
    expect(transferAbilities(transfer({ status: "requested" }), TARGET).canCancel).toBe(false);
  });

  it("closes every action once the transfer is terminal", () => {
    for (const status of ["accepted", "rejected", "cancelled"] as TransferStatus[]) {
      for (const school of [SOURCE, TARGET]) {
        const abilities = transferAbilities(transfer({ status }), school);
        expect(abilities.isTerminal).toBe(true);
        expect(abilities.canSourceApprove).toBe(false);
        expect(abilities.canTargetApprove).toBe(false);
        expect(abilities.canAccept).toBe(false);
        expect(abilities.canReject).toBe(false);
        expect(abilities.canCancel).toBe(false);
      }
    }
  });

  it("reports the student's record as released only once the source school released it", () => {
    expect(transferAbilities(transfer({ status: "requested" }), TARGET).studentRecordReleased).toBe(
      false
    );
    expect(
      transferAbilities(transfer({ status: "source_approved" }), TARGET).studentRecordReleased
    ).toBe(true);
    expect(
      transferAbilities(transfer({ status: "requested", sourceApprovedAt: "2025-01-02" }), TARGET)
        .studentRecordReleased
    ).toBe(true);
  });

  it("works from bare school ids as well as populated schools", () => {
    const bare = transfer({ sourceSchoolId: SOURCE, targetSchoolId: TARGET });
    expect(transferAbilities(bare, SOURCE).isSource).toBe(true);
    expect(transferAbilities(bare, TARGET).isTarget).toBe(true);
  });
});

// ─── Reference helpers ────────────────────────────────────────────────────────

describe("reference helpers", () => {
  it("reads an id from either shape", () => {
    expect(refId("abc")).toBe("abc");
    expect(refId({ _id: "abc" })).toBe("abc");
    expect(refId(null)).toBe("");
  });

  it("labels a populated year by its year, and a term by its name", () => {
    expect(refLabel({ _id: "y1", year: "2024/2025" })).toBe("2024/2025");
    expect(refLabel({ _id: "t1", name: "First Term" })).toBe("First Term");
  });

  it("falls back rather than showing a raw id", () => {
    expect(refLabel("64b0")).toBe("—");
    expect(refLabel(undefined, "Not set")).toBe("Not set");
    expect(classLabel("64b0")).toBe("—");
  });

  it("labels a class with its grade level when there is one", () => {
    expect(classLabel({ _id: "c1", name: "JSS 1A", gradeLevel: "JSS1" })).toBe("JSS 1A (JSS1)");
    expect(classLabel({ _id: "c1", name: "JSS 1A" })).toBe("JSS 1A");
  });

  it("names a student from whichever fields the API released", () => {
    expect(studentLabel({ _id: "s1", userId: { firstName: "Ada", lastName: "Obi" } })).toBe(
      "Ada Obi"
    );
    expect(studentLabel({ _id: "s1", firstName: "Ada", lastName: "Obi" })).toBe("Ada Obi");
  });

  it("falls back to the admission number, never the database id", () => {
    expect(studentLabel({ _id: "64b0", admissionNumber: "ADM-12" })).toBe("ADM-12");
    expect(studentLabel({ _id: "64b0" })).toBe("—");
    expect(studentLabel("64b0")).toBe("—");
  });
});

// ─── Promotions ───────────────────────────────────────────────────────────────

function run(overrides: Partial<PromotionRun> = {}): PromotionRun {
  return {
    _id: "r1",
    schoolId: "school-1",
    fromAcademicYearId: "y1",
    toAcademicYearId: "y2",
    status: "draft",
    decisions: [],
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("promotion run endpoints", () => {
  it("filters, reads, creates and transitions runs", async () => {
    mockGet.mockResolvedValue([]);
    await listPromotionRuns("draft");
    expect(mockGet).toHaveBeenCalledWith("/transit/promotions?status=draft");

    mockGet.mockResolvedValueOnce(run());
    await getPromotionRun("r1");
    expect(mockGet).toHaveBeenCalledWith("/transit/promotions/r1");

    mockPost.mockResolvedValue(run());
    const payload = { fromAcademicYearId: "y1", toAcademicYearId: "y2", decisions: [] };
    await createPromotionRun(payload);
    expect(mockPost).toHaveBeenCalledWith("/transit/promotions", payload);

    await validatePromotionRun("r1");
    expect(mockPost).toHaveBeenCalledWith("/transit/promotions/r1/validate");

    await commitPromotionRun("r1");
    expect(mockPost).toHaveBeenCalledWith("/transit/promotions/r1/commit");

    await cancelPromotionRun("r1");
    expect(mockPost).toHaveBeenCalledWith("/transit/promotions/r1/cancel");
  });
});

describe("promotion helpers", () => {
  it("builds one decision per student, from enrollments or student records", () => {
    expect(
      buildBulkDecisions([{ studentId: { _id: "s1" } }, { studentId: "s2" }], "c1", "c2")
    ).toEqual([
      { studentId: "s1", fromClassId: "c1", toClassId: "c2", repeatClass: false },
      { studentId: "s2", fromClassId: "c1", toClassId: "c2", repeatClass: false },
    ]);
    expect(buildBulkDecisions([{ _id: "s3" }], "c1", "c2")[0].studentId).toBe("s3");
  });

  it("reads validation problems from the sentences the API stores", () => {
    const validated = run({
      status: "validated",
      validationErrors: ["Student s1 was not found"],
      validationWarnings: ["Student s2 has no active enrollment history yet"],
    });
    expect(promotionErrors(validated)).toEqual(["Student s1 was not found"]);
    expect(promotionWarnings(validated)).toEqual([
      "Student s2 has no active enrollment history yet",
    ]);
  });

  it("still reads the older object and validationResult shapes", () => {
    const legacy = run({
      validationErrors: [{ studentId: "s1", reason: "not in source class" }],
    });
    expect(promotionErrors(legacy)).toEqual(["s1 - not in source class"]);

    const older = run({
      validationResult: {
        eligible: [],
        ineligible: [{ studentId: "s1", reason: "missing" }],
        warnings: ["check dates"],
      },
    });
    expect(promotionErrors(older)).toEqual(["s1 - missing"]);
    expect(promotionWarnings(older)).toEqual(["check dates"]);
  });

  it("counts eligible students as the decisions that are not blocked", () => {
    const validated = run({
      status: "validated",
      decisions: [
        { studentId: "s1", fromClassId: "c1", toClassId: "c2" },
        { studentId: "s2", fromClassId: "c1", toClassId: "c2" },
      ],
      validationErrors: ["Student s1 was not found"],
      validationWarnings: ["w"],
    });
    expect(getValidationSummary(validated)).toEqual({
      total: 2,
      errorsCount: 1,
      warningsCount: 1,
      eligibleCount: 1,
    });
    expect(getValidationSummary(null)).toEqual({
      total: 0,
      errorsCount: 0,
      warningsCount: 0,
      eligibleCount: 0,
    });
  });

  it("allows a commit only for a validated run with nothing blocking", () => {
    expect(canCommit(run({ status: "validated" }))).toBe(true);
    expect(canCommit(run({ status: "validated", validationErrors: ["boom"] }))).toBe(false);
    expect(canCommit(run({ status: "draft" }))).toBe(false);
    expect(canCommit(run({ status: "committed" }))).toBe(false);
    expect(canCommit(null)).toBe(false);
  });

  it("treats draft and validated runs as still editable", () => {
    expect(isRunEditable(run({ status: "draft" }))).toBe(true);
    expect(isRunEditable(run({ status: "validated" }))).toBe(true);
    expect(isRunEditable(run({ status: "committed" }))).toBe(false);
    expect(isRunEditable(run({ status: "cancelled" }))).toBe(false);
  });
});

// ─── Enrollments ──────────────────────────────────────────────────────────────

describe("enrollments", () => {
  it("sends only the filters that are set", async () => {
    mockGet.mockResolvedValue([]);
    await listEnrollments({ status: "active", classId: "c1" });
    expect(mockGet).toHaveBeenCalledWith("/transit/enrollments?classId=c1&status=active");

    await listEnrollments();
    expect(mockGet).toHaveBeenCalledWith("/transit/enrollments");
  });

  it("creates an enrollment from the DTO's fields", async () => {
    mockPost.mockResolvedValueOnce({ _id: "e1" });
    await createEnrollment({
      studentId: "s1",
      classId: "c1",
      academicYearId: "y1",
      termId: "t1",
      source: "manual",
    });
    expect(mockPost).toHaveBeenCalledWith("/transit/enrollments", {
      studentId: "s1",
      classId: "c1",
      academicYearId: "y1",
      termId: "t1",
      source: "manual",
    });
  });

  it("surfaces the conflict when a student is already enrolled", async () => {
    mockPost.mockRejectedValueOnce(
      new ApiError("CONFLICT", "Student already has an active enrollment", 409)
    );
    await expect(
      createEnrollment({ studentId: "s1", classId: "c1", academicYearId: "y1" })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("reads a student's history", async () => {
    mockGet.mockResolvedValueOnce([{ _id: "e1" }]);
    await expect(getStudentEnrollmentHistory("s1")).resolves.toHaveLength(1);
    expect(mockGet).toHaveBeenCalledWith("/transit/students/s1/enrollments");
  });
});

// ─── Snapshot, closure and school search ──────────────────────────────────────

describe("snapshot, closure and school search", () => {
  it("reads a student snapshot", async () => {
    mockGet.mockResolvedValueOnce({ student: { _id: "s1" } });
    await getStudentSnapshot("s1");
    expect(mockGet).toHaveBeenCalledWith("/transit/students/s1/snapshot");
  });

  it("reports the API's refusal to show an unreleased student", async () => {
    mockGet.mockRejectedValueOnce(new ApiError("NOT_FOUND", "Student not found", 404));
    await expect(getStudentSnapshot("s1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("reads a pre-close summary and closes a year", async () => {
    mockGet.mockResolvedValueOnce({ canClose: true, blockers: [] });
    await getPreCloseSummary("y1");
    expect(mockGet).toHaveBeenCalledWith("/transit/academic-years/y1/pre-close-summary");

    mockPost.mockResolvedValueOnce({ snapshotId: "snap1", message: "Closed" });
    await closeAcademicYear("y1");
    expect(mockPost).toHaveBeenCalledWith("/transit/academic-years/y1/close");
  });

  it("unwraps a school search that arrives in an envelope", async () => {
    mockGet.mockResolvedValueOnce({ data: [{ _id: "sch1", name: "Unity" }] });
    await expect(searchSchools("uni")).resolves.toEqual([{ _id: "sch1", name: "Unity" }]);
    expect(mockGet).toHaveBeenCalledWith("/schools/search?query=uni");
  });

  it("skips the request for an empty query", async () => {
    await expect(searchSchools("  ")).resolves.toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });
});
