import { apiClient } from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TransferStatus =
  | "requested"
  | "source_approved"
  | "target_approved"
  | "accepted"
  | "rejected"
  | "cancelled";

export interface SchoolRef {
  _id: string;
  name: string;
}

export interface ClassRef {
  _id: string;
  name: string;
  gradeLevel: string;
}

export interface StudentRef {
  _id: string;
  firstName?: string;
  lastName?: string;
  studentId?: string;
  gradeLevel?: string;
  classId?: string;
}

export interface TransferRequest {
  _id: string;
  studentId: StudentRef | string;
  sourceSchoolId: SchoolRef | string;
  targetSchoolId: SchoolRef | string;
  sourceClassId?: ClassRef | string;
  targetClassId: ClassRef | string;
  targetAcademicYearId: string;
  targetTermId?: string;
  status: TransferStatus;
  reason?: string;
  notes?: string;
  documents: string[];
  initiatedBy: "source" | "target";
  requestedBy?: string;
  sourceApprovedBy?: string;
  sourceApprovedAt?: string;
  targetApprovedBy?: string;
  targetApprovedAt?: string;
  acceptedBy?: string;
  acceptedAt?: string;
  transferPackage?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionDecision {
  studentId: string;
  fromClassId: string;
  toClassId: string;
  targetGradeLevel?: string;
  repeatClass?: boolean;
}

export interface CreatePromotionRunPayload {
  fromAcademicYearId: string;
  toAcademicYearId: string;
  targetTermId?: string;
  decisions: PromotionDecision[];
}

export interface PromotionValidationIssue {
  studentId?: string;
  message?: string;
  reason?: string;
  field?: string;
}

export interface PromotionRun {
  _id: string;
  schoolId: string;
  fromAcademicYearId: string | { _id: string; year?: string; name?: string };
  toAcademicYearId: string | { _id: string; year?: string; name?: string };
  targetTermId?: string | { _id: string; name?: string };
  status: "draft" | "validated" | "committed" | "cancelled";
  decisions: PromotionDecision[];
  validationErrors?: PromotionValidationIssue[];
  validationWarnings?: (PromotionValidationIssue | string)[];
  validationResult?: {
    eligible: { studentId: string; toClassId: string }[];
    ineligible: { studentId: string; reason: string }[];
    warnings: string[];
  };
  validatedAt?: string;
  committedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransitDashboard {
  pendingIncoming: number;
  pendingOutgoing: number;
  openPromotionRuns: number;
  studentsWithoutEnrollment: number;
  totalActiveEnrollments: number;
}

export interface StudentSnapshot {
  student: {
    _id: string;
    firstName?: string;
    lastName?: string;
    studentId?: string;
    gradeLevel?: string;
    currentClass?: ClassRef | null;
  };
  activeEnrollment?: Record<string, unknown> | null;
  recentGrades: {
    courseId: string;
    gradeLevel: string;
    percentage: number;
    cumulativeScore: number;
    maxScore: number;
  }[];
  attendanceSummary: Record<string, number>;
  enrollmentHistory: {
    _id: string;
    schoolId?: SchoolRef;
    classId?: ClassRef;
    status: string;
    createdAt: string;
  }[];
}

export interface CreateTransferPayload {
  studentId: string;
  targetSchoolId?: string;
  targetClassId: string;
  targetAcademicYearId: string;
  targetTermId?: string;
  reason?: string;
  notes?: string;
  documents?: string[];
  initiatedBy?: "source" | "target";
}

export interface SearchSchoolResult {
  _id: string;
  name: string;
  address?: string;
  email?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data as T;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getTransitDashboard(): Promise<TransitDashboard> {
  const res = await apiClient.get("/transit/dashboard");
  return handle<TransitDashboard>(res);
}

// ─── Transfers ────────────────────────────────────────────────────────────────

export async function listTransfers(status?: string): Promise<TransferRequest[]> {
  const qs = status ? `?status=${status}` : "";
  const res = await apiClient.get(`/transit/transfers${qs}`);
  return handle<TransferRequest[]>(res);
}

export async function getTransfer(id: string): Promise<TransferRequest> {
  const res = await apiClient.get(`/transit/transfers/${id}`);
  return handle<TransferRequest>(res);
}

export async function createTransfer(payload: CreateTransferPayload): Promise<TransferRequest> {
  const res = await apiClient.post("/transit/transfers", payload);
  return handle<TransferRequest>(res);
}

export async function sourceApproveTransfer(id: string): Promise<TransferRequest> {
  const res = await apiClient.post(`/transit/transfers/${id}/source-approve`);
  return handle<TransferRequest>(res);
}

export async function targetApproveTransfer(id: string): Promise<TransferRequest> {
  const res = await apiClient.post(`/transit/transfers/${id}/target-approve`);
  return handle<TransferRequest>(res);
}

export async function acceptTransfer(id: string): Promise<TransferRequest> {
  const res = await apiClient.post(`/transit/transfers/${id}/accept`);
  return handle<TransferRequest>(res);
}

export async function rejectTransfer(id: string, reason?: string): Promise<TransferRequest> {
  const res = await apiClient.post(`/transit/transfers/${id}/reject`, { reason });
  return handle<TransferRequest>(res);
}

export async function cancelTransfer(id: string, reason?: string): Promise<TransferRequest> {
  const res = await apiClient.post(`/transit/transfers/${id}/cancel`, { reason });
  return handle<TransferRequest>(res);
}

// ─── Student Snapshot ─────────────────────────────────────────────────────────

export async function getStudentSnapshot(studentId: string): Promise<StudentSnapshot> {
  const res = await apiClient.get(`/transit/students/${studentId}/snapshot`);
  return handle<StudentSnapshot>(res);
}

// ─── Promotions ───────────────────────────────────────────────────────────────

export async function listPromotionRuns(status?: string): Promise<PromotionRun[]> {
  const qs = status ? `?status=${status}` : "";
  const res = await apiClient.get(`/transit/promotions${qs}`);
  return handle<PromotionRun[]>(res);
}

export async function getPromotionRun(id: string): Promise<PromotionRun> {
  const res = await apiClient.get(`/transit/promotions/${id}`);
  return handle<PromotionRun>(res);
}

export async function createPromotionRun(
  payload: CreatePromotionRunPayload
): Promise<PromotionRun> {
  const res = await apiClient.post("/transit/promotions", payload);
  return handle<PromotionRun>(res);
}

export async function validatePromotionRun(id: string): Promise<PromotionRun> {
  const res = await apiClient.post(`/transit/promotions/${id}/validate`);
  return handle<PromotionRun>(res);
}

export async function commitPromotionRun(id: string): Promise<PromotionRun> {
  const res = await apiClient.post(`/transit/promotions/${id}/commit`);
  return handle<PromotionRun>(res);
}

export async function cancelPromotionRun(id: string): Promise<PromotionRun> {
  const res = await apiClient.post(`/transit/promotions/${id}/cancel`);
  return handle<PromotionRun>(res);
}

// ─── Academic Year Closure ────────────────────────────────────────────────────

export async function getPreCloseSummary(academicYearId: string) {
  const res = await apiClient.get(`/transit/academic-years/${academicYearId}/pre-close-summary`);
  return handle<{
    canClose: boolean;
    blockers: string[];
    classCount: number;
    activeEnrollmentCount: number;
    attendanceRecordCount: number;
    assessmentGradeRecordCount: number;
    courseGradeRecordCount: number;
  }>(res);
}

export async function closeAcademicYear(academicYearId: string) {
  const res = await apiClient.post(`/transit/academic-years/${academicYearId}/close`);
  return handle<{ snapshotId: string; message: string }>(res);
}

export async function getClosureSnapshot(academicYearId: string) {
  const res = await apiClient.get(`/transit/academic-years/${academicYearId}/snapshot`);
  return handle<Record<string, unknown>>(res);
}

// ─── Enrollments ──────────────────────────────────────────────────────────────

export interface StudentEnrollment {
  _id: string;
  studentId: string | { _id: string; userId?: { firstName?: string; lastName?: string } };
  schoolId: string | { _id: string; name: string };
  classId: string | { _id: string; name: string; gradeLevel: string };
  academicYearId: string | { _id: string; name: string };
  termId?: string | { _id: string; name: string };
  status:
    | "active"
    | "year_ended"
    | "promoted"
    | "repeated"
    | "transferred_out"
    | "transferred_in"
    | "withdrawn"
    | "graduated";
  source: "manual" | "promotion" | "transfer" | "onboarding";
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export async function createEnrollment(payload: {
  studentId: string;
  classId: string;
  academicYearId: string;
  termId?: string;
  source?: string;
}): Promise<StudentEnrollment> {
  const res = await apiClient.post("/transit/enrollments", payload);
  return handle<StudentEnrollment>(res);
}

export async function getStudentEnrollmentHistory(studentId: string): Promise<StudentEnrollment[]> {
  const res = await apiClient.get(`/transit/students/${studentId}/enrollments`);
  return handle<StudentEnrollment[]>(res);
}

export async function listEnrollments(params?: {
  classId?: string;
  academicYearId?: string;
  status?: string;
}): Promise<StudentEnrollment[]> {
  const qs = new URLSearchParams();
  if (params?.classId) qs.set("classId", params.classId);
  if (params?.academicYearId) qs.set("academicYearId", params.academicYearId);
  if (params?.status) qs.set("status", params.status);
  const q = qs.toString();
  const res = await apiClient.get(`/transit/enrollments${q ? `?${q}` : ""}`);
  return handle<StudentEnrollment[]>(res);
}

export function buildBulkDecisions(
  sourceClassStudents: Array<{ _id: string } | { studentId: string | { _id: string } }>,
  sourceClassId: string,
  targetClassId: string
): PromotionDecision[] {
  return sourceClassStudents.map((student) => {
    const studentId =
      "studentId" in student
        ? typeof student.studentId === "string"
          ? student.studentId
          : student.studentId._id
        : student._id;

    return {
      studentId,
      fromClassId: sourceClassId,
      toClassId: targetClassId,
      repeatClass: false,
    };
  });
}

export function getValidationSummary(run?: PromotionRun | null) {
  const legacyErrors = run?.validationResult?.ineligible ?? [];
  const legacyWarnings = run?.validationResult?.warnings ?? [];
  const errors = run?.validationErrors?.length ? run.validationErrors : legacyErrors;
  const warnings = run?.validationWarnings?.length ? run.validationWarnings : legacyWarnings;
  const total = run?.decisions?.length || 0;

  return {
    total,
    errorsCount: errors.length,
    warningsCount: warnings.length,
    eligibleCount: Math.max(total - errors.length, 0),
  };
}

export function canCommit(run?: PromotionRun | null) {
  return (
    run?.status === "validated" &&
    (!run?.validationErrors || run.validationErrors.length === 0) &&
    (!run?.validationResult?.ineligible || run.validationResult.ineligible.length === 0)
  );
}

// ─── School Search ────────────────────────────────────────────────────────────

export async function searchSchools(query: string): Promise<SearchSchoolResult[]> {
  const res = await apiClient.get(`/schools/search?query=${encodeURIComponent(query)}`);
  const body = await handle<{ data?: SearchSchoolResult[] } | SearchSchoolResult[]>(res);
  return Array.isArray(body) ? body : (body.data ?? []);
}
