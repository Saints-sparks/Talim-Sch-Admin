/**
 * Transit — moving children between classes and schools.
 *
 * Mirrors `talimBE-V2/src/modules/transit`: student enrollments, promotion runs
 * across academic years, school-to-school transfer requests and academic-year
 * closure. Every call goes through the typed `api` facade, so a failure arrives
 * as an `ApiError` with a stable `code` the pages branch on.
 *
 * The transfer state machine lives here too (`transferAbilities`): which side of
 * a transfer may act, and in which status. It is a pure mirror of the backend's
 * guards — the UI hides what the API would refuse, and never shows a student's
 * record before the source school has released it.
 */
import { api } from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Lifecycle of a school-to-school transfer request. */
export type TransferStatus =
  | "requested"
  | "source_approved"
  | "target_approved"
  | "accepted"
  | "rejected"
  | "cancelled";

/** Which school opened the transfer: the one releasing, or the one receiving. */
export type TransferInitiator = "source" | "target";

/** Lifecycle of a promotion run. */
export type PromotionRunStatus = "draft" | "validated" | "committed" | "cancelled";

/** Lifecycle of a single enrollment record. */
export type EnrollmentStatus =
  | "active"
  | "year_ended"
  | "promoted"
  | "repeated"
  | "transferred_out"
  | "transferred_in"
  | "withdrawn"
  | "graduated";

/** How an enrollment record came to exist. */
export type EnrollmentSource = "manual" | "promotion" | "transfer" | "onboarding";

/** A reference the API returns either as a bare id or as a populated document. */
export type Ref<T> = string | T;

/** A populated school reference. */
export interface SchoolRef {
  _id: string;
  name?: string;
}

/** A populated class reference. */
export interface ClassRef {
  _id: string;
  name?: string;
  gradeLevel?: string;
}

/** A populated academic year or term reference. */
export interface PeriodRef {
  _id: string;
  name?: string;
  year?: string;
}

/**
 * A populated student reference. Before the source school releases a student,
 * the API sends the receiving school only `_id`, `admissionNumber` and the
 * user's name — never contacts, dates of birth or parent links.
 */
export interface StudentRef {
  _id: string;
  admissionNumber?: string;
  firstName?: string;
  lastName?: string;
  studentId?: string;
  gradeLevel?: string;
  userId?: { _id?: string; firstName?: string; lastName?: string };
}

/** A transfer request as the API presents it to one of the two schools. */
export interface TransferRequest {
  _id: string;
  studentId: Ref<StudentRef>;
  sourceSchoolId: Ref<SchoolRef>;
  targetSchoolId: Ref<SchoolRef>;
  sourceClassId?: Ref<ClassRef>;
  targetClassId?: Ref<ClassRef>;
  targetAcademicYearId?: Ref<PeriodRef>;
  targetTermId?: Ref<PeriodRef>;
  status: TransferStatus;
  reason?: string;
  notes?: string;
  documents?: string[];
  initiatedBy: TransferInitiator;
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

/** Body of `POST /transit/transfers`, matching `CreateStudentTransferRequestDto`. */
export interface CreateTransferPayload {
  studentId: string;
  targetSchoolId?: string;
  targetClassId?: string;
  targetAcademicYearId?: string;
  targetTermId?: string;
  reason?: string;
  notes?: string;
  documents?: string[];
  initiatedBy?: TransferInitiator;
}

/** One student's promotion decision inside a run. */
export interface PromotionDecision {
  studentId: string;
  fromClassId: string;
  toClassId: string;
  targetGradeLevel?: string;
  repeatClass?: boolean;
}

/** Body of `POST /transit/promotions`, matching `CreatePromotionRunDto`. */
export interface CreatePromotionRunPayload {
  fromAcademicYearId: string;
  toAcademicYearId: string;
  targetTermId?: string;
  decisions: PromotionDecision[];
}

/** A validation problem on a run — a plain sentence today, an object on older runs. */
export interface PromotionValidationIssue {
  studentId?: string;
  message?: string;
  reason?: string;
  field?: string;
}

/** A promotion run: a batch of decisions validated, then committed, as one unit. */
export interface PromotionRun {
  _id: string;
  schoolId: string;
  fromAcademicYearId: Ref<PeriodRef>;
  toAcademicYearId: Ref<PeriodRef>;
  targetTermId?: Ref<PeriodRef>;
  status: PromotionRunStatus;
  decisions: PromotionDecision[];
  validationErrors?: (PromotionValidationIssue | string)[];
  validationWarnings?: (PromotionValidationIssue | string)[];
  /** Shape used by runs created before validation moved onto the run itself. */
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

/** One row of a student's enrollment history. */
export interface StudentEnrollment {
  _id: string;
  studentId: Ref<StudentRef>;
  schoolId: Ref<SchoolRef>;
  classId: Ref<ClassRef>;
  academicYearId: Ref<PeriodRef>;
  termId?: Ref<PeriodRef>;
  status: EnrollmentStatus;
  source: EnrollmentSource;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

/** Body of `POST /transit/enrollments`, matching `CreateEnrollmentDto`. */
export interface CreateEnrollmentPayload {
  studentId: string;
  classId: string;
  academicYearId: string;
  termId?: string;
  source?: EnrollmentSource;
}

/** Filters accepted by `GET /transit/enrollments`. */
export interface EnrollmentFilters {
  classId?: string;
  academicYearId?: string;
  status?: string;
}

/** The transit overview counters, flattened for the dashboard cards. */
export interface TransitDashboard {
  pendingIncoming: number;
  pendingOutgoing: number;
  openPromotionRuns: number;
  totalActiveEnrollments: number;
  studentsWithoutEnrollment: number;
  currentAcademicYear: { id: string; year?: string; status?: string } | null;
}

/** Nested shape `GET /transit/dashboard` actually returns. */
interface RawTransitDashboard {
  currentAcademicYear?: { id: string; year?: string; status?: string } | null;
  transfers?: { pendingIncoming?: number; pendingOutgoing?: number };
  promotions?: { openRuns?: number };
  enrollments?: { totalActive?: number; studentsWithoutEnrollment?: number };
}

/** A live academic snapshot of a student, used to preview a transfer. */
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
    courseId?: string;
    gradeLevel?: string;
    percentage?: number;
    cumulativeScore?: number;
    maxScore?: number;
  }[];
  attendanceSummary: Record<string, number>;
  enrollmentHistory: {
    _id: string;
    schoolId?: Ref<SchoolRef>;
    classId?: Ref<ClassRef>;
    status: string;
    createdAt: string;
  }[];
}

/** What `GET /transit/academic-years/:id/pre-close-summary` reports. */
export interface PreCloseSummary {
  canClose: boolean;
  blockers: string[];
  classCount: number;
  activeEnrollmentCount: number;
  attendanceRecordCount: number;
  assessmentGradeRecordCount: number;
  courseGradeRecordCount: number;
}

/** A school returned by the public school search. */
export interface SearchSchoolResult {
  _id: string;
  name: string;
  address?: string;
  email?: string;
}

// ─── Reference helpers ────────────────────────────────────────────────────────

/**
 * The id behind a reference, whether the API populated it or not.
 *
 * @param value - A populated document or a bare id.
 * @returns The id, or an empty string when there is none.
 */
export function refId(value?: Ref<{ _id: string }> | null): string {
  if (!value) return "";
  return typeof value === "string" ? value : (value._id ?? "");
}

/**
 * A human label for a populated reference (class name, academic year, term).
 *
 * @param value - A populated document or a bare id.
 * @param fallback - Shown when the API sent only an id.
 * @returns The label to render.
 */
export function refLabel(value?: Ref<PeriodRef | ClassRef | SchoolRef> | null, fallback = "—"): string {
  if (!value || typeof value === "string") return fallback;
  const period = value as PeriodRef;
  return value.name ?? period.year ?? fallback;
}

/**
 * A class label with its grade level, e.g. `JSS 1A (JSS1)`.
 *
 * @param value - A populated class or a bare id.
 * @param fallback - Shown when the API sent only an id.
 * @returns The label to render.
 */
export function classLabel(value?: Ref<ClassRef> | null, fallback = "—"): string {
  if (!value || typeof value === "string") return fallback;
  if (!value.name) return fallback;
  return value.gradeLevel ? `${value.name} (${value.gradeLevel})` : value.name;
}

/**
 * The student's name, from whichever fields the API released.
 *
 * Falls back to the admission number rather than a raw database id, and never
 * invents detail the API withheld.
 *
 * @param value - A populated student or a bare id.
 * @param fallback - Shown when nothing identifying was released.
 * @returns The name to render.
 */
export function studentLabel(value?: Ref<StudentRef> | null, fallback = "—"): string {
  if (!value || typeof value === "string") return fallback;
  const fromUser = `${value.userId?.firstName ?? ""} ${value.userId?.lastName ?? ""}`.trim();
  if (fromUser) return fromUser;
  const flat = `${value.firstName ?? ""} ${value.lastName ?? ""}`.trim();
  if (flat) return flat;
  return value.admissionNumber ?? value.studentId ?? fallback;
}

// ─── Transfer state machine ───────────────────────────────────────────────────

/** Statuses a transfer may still be rejected from (target school only). */
const REJECTABLE: TransferStatus[] = ["requested", "source_approved", "target_approved"];

/** Statuses a transfer may still be cancelled from (source school only). */
const CANCELLABLE: TransferStatus[] = ["requested", "source_approved"];

/** Statuses no action can move a transfer out of. */
const TERMINAL: TransferStatus[] = ["accepted", "rejected", "cancelled"];

/** Statuses in which the source school has released the student's record. */
const RELEASED: TransferStatus[] = ["source_approved", "target_approved", "accepted"];

/**
 * What the signed-in school may do to a transfer right now.
 *
 * Every flag mirrors a guard in `TransitService`, so the UI shows exactly the
 * actions the API would allow and nothing else.
 */
export interface TransferAbilities {
  /** This school is releasing the student. */
  isSource: boolean;
  /** This school is receiving the student. */
  isTarget: boolean;
  /** The transfer has finished — accepted, rejected or cancelled. */
  isTerminal: boolean;
  /** Source school may release the student. */
  canSourceApprove: boolean;
  /** Target school may approve the release. */
  canTargetApprove: boolean;
  /** Target school may complete the transfer. */
  canAccept: boolean;
  /** Target school may reject the request. */
  canReject: boolean;
  /** Source school may withdraw the request. */
  canCancel: boolean;
  /** Nothing to do here until the other school acts. */
  waitingOnOtherSchool: boolean;
  /** The source school has released the student's academic record. */
  studentRecordReleased: boolean;
}

/**
 * Reads the transfer state machine from one school's point of view.
 *
 * The order is fixed by the backend: the source school releases the student
 * (`source-approve`), then the target school approves (`target-approve`) and
 * accepts. A request the source school raised itself is released on creation.
 *
 * @param transfer - The transfer, or `null` while it loads.
 * @param schoolId - The signed-in school's id, or `null` when signed out.
 * @returns Every action flag, all `false` when either argument is missing.
 */
export function transferAbilities(
  transfer: TransferRequest | null | undefined,
  schoolId: string | null | undefined
): TransferAbilities {
  const none: TransferAbilities = {
    isSource: false,
    isTarget: false,
    isTerminal: false,
    canSourceApprove: false,
    canTargetApprove: false,
    canAccept: false,
    canReject: false,
    canCancel: false,
    waitingOnOtherSchool: false,
    studentRecordReleased: false,
  };
  if (!transfer || !schoolId) return none;

  const isSource = refId(transfer.sourceSchoolId) === schoolId;
  const isTarget = refId(transfer.targetSchoolId) === schoolId;
  const status = transfer.status;
  const released = RELEASED.includes(status) || Boolean(transfer.sourceApprovedAt);

  // A request target-approved before the release step existed can still be
  // released by the source school; its status stays `target_approved`.
  const legacyUnreleased = status === "target_approved" && !transfer.sourceApprovedAt;

  return {
    isSource,
    isTarget,
    isTerminal: TERMINAL.includes(status),
    canSourceApprove: isSource && (status === "requested" || legacyUnreleased),
    canTargetApprove: isTarget && status === "source_approved",
    canAccept: isTarget && status === "target_approved" && Boolean(transfer.sourceApprovedAt),
    canReject: isTarget && REJECTABLE.includes(status),
    canCancel: isSource && CANCELLABLE.includes(status),
    waitingOnOtherSchool:
      (isTarget && status === "requested") || (isSource && status === "source_approved"),
    studentRecordReleased: released,
  };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * The transit overview counters for the signed-in school.
 *
 * @returns The counters, flattened from the API's grouped response.
 * @throws `ApiError` when the request fails.
 */
export async function getTransitDashboard(): Promise<TransitDashboard> {
  const raw = await api.get<RawTransitDashboard>("/transit/dashboard");
  return {
    pendingIncoming: raw?.transfers?.pendingIncoming ?? 0,
    pendingOutgoing: raw?.transfers?.pendingOutgoing ?? 0,
    openPromotionRuns: raw?.promotions?.openRuns ?? 0,
    totalActiveEnrollments: raw?.enrollments?.totalActive ?? 0,
    studentsWithoutEnrollment: raw?.enrollments?.studentsWithoutEnrollment ?? 0,
    currentAcademicYear: raw?.currentAcademicYear ?? null,
  };
}

// ─── Transfers ────────────────────────────────────────────────────────────────

/**
 * Every transfer this school is a party to, newest first.
 *
 * @param status - Optional `TransferStatus` filter.
 * @returns The transfers, incoming and outgoing.
 * @throws `ApiError` when the request fails.
 */
export async function listTransfers(status?: string): Promise<TransferRequest[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await api.get<TransferRequest[]>(`/transit/transfers${qs}`);
  return Array.isArray(data) ? data : [];
}

/**
 * One transfer request.
 *
 * @param id - The transfer id.
 * @returns The transfer, as presented to the signed-in school.
 * @throws `ApiError` — `NOT_FOUND` when it belongs to neither of your schools.
 */
export function getTransfer(id: string): Promise<TransferRequest> {
  return api.get<TransferRequest>(`/transit/transfers/${id}`);
}

/**
 * Opens a transfer request, pushing a student out or pulling one in.
 *
 * @param payload - The request; `targetSchoolId` is required for a push.
 * @returns The created transfer.
 * @throws `ApiError` — `CONFLICT` when the student already has an open request.
 */
export function createTransfer(payload: CreateTransferPayload): Promise<TransferRequest> {
  return api.post<TransferRequest>("/transit/transfers", payload);
}

/**
 * Source school releases the student, attaching their academic record.
 *
 * @param id - The transfer id.
 * @returns The updated transfer.
 * @throws `ApiError` when this school is not the source, or the status forbids it.
 */
export function sourceApproveTransfer(id: string): Promise<TransferRequest> {
  return api.post<TransferRequest>(`/transit/transfers/${id}/source-approve`);
}

/**
 * Target school approves a released transfer.
 *
 * @param id - The transfer id.
 * @returns The updated transfer.
 * @throws `ApiError` when the source school has not released the student yet.
 */
export function targetApproveTransfer(id: string): Promise<TransferRequest> {
  return api.post<TransferRequest>(`/transit/transfers/${id}/target-approve`);
}

/**
 * Target school completes the transfer: the student changes school and a new
 * enrollment opens.
 *
 * @param id - The transfer id.
 * @returns The completed transfer.
 * @throws `ApiError` when the transfer is not target-approved and released.
 */
export function acceptTransfer(id: string): Promise<TransferRequest> {
  return api.post<TransferRequest>(`/transit/transfers/${id}/accept`);
}

/**
 * Target school rejects the request.
 *
 * @param id - The transfer id.
 * @param reason - Optional reason, stored on the request and shown to the source school.
 * @returns The rejected transfer.
 * @throws `ApiError` when this school is not the target.
 */
export function rejectTransfer(id: string, reason?: string): Promise<TransferRequest> {
  return api.post<TransferRequest>(`/transit/transfers/${id}/reject`, { reason });
}

/**
 * Source school withdraws the request.
 *
 * @param id - The transfer id.
 * @param reason - Optional reason, stored on the request.
 * @returns The cancelled transfer.
 * @throws `ApiError` when this school is not the source, or it is too late to cancel.
 */
export function cancelTransfer(id: string, reason?: string): Promise<TransferRequest> {
  return api.post<TransferRequest>(`/transit/transfers/${id}/cancel`, { reason });
}

/**
 * A student's live academic snapshot, for previewing a transfer.
 *
 * Only the student's own school, or a school the student has been released to,
 * may read this — anyone else gets `NOT_FOUND`.
 *
 * @param studentId - The student id (a student record id or their user id).
 * @returns The snapshot.
 * @throws `ApiError` — `NOT_FOUND` when the record has not been released to you.
 */
export function getStudentSnapshot(studentId: string): Promise<StudentSnapshot> {
  return api.get<StudentSnapshot>(`/transit/students/${studentId}/snapshot`);
}

// ─── Promotions ───────────────────────────────────────────────────────────────

/**
 * The school's promotion runs, newest first.
 *
 * @param status - Optional `PromotionRunStatus` filter.
 * @returns The runs.
 * @throws `ApiError` when the request fails.
 */
export async function listPromotionRuns(status?: string): Promise<PromotionRun[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await api.get<PromotionRun[]>(`/transit/promotions${qs}`);
  return Array.isArray(data) ? data : [];
}

/**
 * One promotion run, with its full decision list.
 *
 * @param id - The run id.
 * @returns The run.
 * @throws `ApiError` — `NOT_FOUND` when the run belongs to another school.
 */
export function getPromotionRun(id: string): Promise<PromotionRun> {
  return api.get<PromotionRun>(`/transit/promotions/${id}`);
}

/**
 * Creates a run and validates it in the same call.
 *
 * @param payload - Source and target year plus one decision per student.
 * @returns The created run, already carrying its validation result.
 * @throws `ApiError` — `BAD_REQUEST` when there are no decisions.
 */
export function createPromotionRun(payload: CreatePromotionRunPayload): Promise<PromotionRun> {
  return api.post<PromotionRun>("/transit/promotions", payload);
}

/**
 * Re-runs validation on a draft or validated run.
 *
 * @param id - The run id.
 * @returns The run with fresh errors and warnings.
 * @throws `ApiError` when the run is already committed.
 */
export function validatePromotionRun(id: string): Promise<PromotionRun> {
  return api.post<PromotionRun>(`/transit/promotions/${id}/validate`);
}

/**
 * Commits a validated run, moving every student into their target class.
 *
 * @param id - The run id.
 * @returns The committed run.
 * @throws `ApiError` when the run is not validated.
 */
export function commitPromotionRun(id: string): Promise<PromotionRun> {
  return api.post<PromotionRun>(`/transit/promotions/${id}/commit`);
}

/**
 * Cancels a draft or validated run. Committed runs cannot be cancelled.
 *
 * @param id - The run id.
 * @returns The cancelled run.
 * @throws `ApiError` when the run is already committed.
 */
export function cancelPromotionRun(id: string): Promise<PromotionRun> {
  return api.post<PromotionRun>(`/transit/promotions/${id}/cancel`);
}

/**
 * Turns a class roster into one promotion decision per student.
 *
 * @param sourceClassStudents - Enrollments or student records for the source class.
 * @param sourceClassId - The class they are leaving.
 * @param targetClassId - The class they are moving into.
 * @returns One decision per student, none marked as repeating.
 */
export function buildBulkDecisions(
  sourceClassStudents: Array<{ _id: string } | { studentId: Ref<{ _id: string }> }>,
  sourceClassId: string,
  targetClassId: string
): PromotionDecision[] {
  return sourceClassStudents.map((student) => ({
    studentId: "studentId" in student ? refId(student.studentId) : student._id,
    fromClassId: sourceClassId,
    toClassId: targetClassId,
    repeatClass: false,
  }));
}

/**
 * Reads a run's validation problems, whichever shape it stores them in.
 *
 * @param run - The run, or `null` while it loads.
 * @returns One sentence per blocking error.
 */
export function promotionErrors(run?: PromotionRun | null): string[] {
  if (!run) return [];
  if (run.validationErrors?.length) return run.validationErrors.map(issueText);
  return run.validationResult?.ineligible.map((item) => `${item.studentId} - ${item.reason}`) ?? [];
}

/**
 * Reads a run's validation warnings, whichever shape it stores them in.
 *
 * @param run - The run, or `null` while it loads.
 * @returns One sentence per warning.
 */
export function promotionWarnings(run?: PromotionRun | null): string[] {
  if (!run) return [];
  if (run.validationWarnings?.length) return run.validationWarnings.map(issueText);
  return run.validationResult?.warnings ?? [];
}

/** Renders one validation issue, old object shape or new sentence, as text. */
function issueText(issue: PromotionValidationIssue | string): string {
  if (typeof issue === "string") return issue;
  return [issue.studentId, issue.field, issue.message ?? issue.reason].filter(Boolean).join(" - ");
}

/**
 * Counts a run's decisions against its validation result.
 *
 * @param run - The run, or `null` while it loads.
 * @returns Totals for the summary tiles.
 */
export function getValidationSummary(run?: PromotionRun | null): {
  total: number;
  errorsCount: number;
  warningsCount: number;
  eligibleCount: number;
} {
  const errorsCount = promotionErrors(run).length;
  const warningsCount = promotionWarnings(run).length;
  const total = run?.decisions?.length ?? 0;

  return {
    total,
    errorsCount,
    warningsCount,
    eligibleCount: Math.max(total - errorsCount, 0),
  };
}

/**
 * Whether a run may be committed — validated, with nothing blocking.
 *
 * @param run - The run, or `null` while it loads.
 * @returns True when the commit button should be live.
 */
export function canCommit(run?: PromotionRun | null): boolean {
  return run?.status === "validated" && promotionErrors(run).length === 0;
}

/**
 * Whether a run may still be validated or cancelled.
 *
 * @param run - The run.
 * @returns True while the run is a draft or validated.
 */
export function isRunEditable(run: PromotionRun): boolean {
  return run.status === "draft" || run.status === "validated";
}

// ─── Academic year closure ────────────────────────────────────────────────────

/**
 * Previews what closing an academic year would affect.
 *
 * @param academicYearId - The year to check.
 * @returns Blockers and record counts.
 * @throws `ApiError` when the year belongs to another school.
 */
export function getPreCloseSummary(academicYearId: string): Promise<PreCloseSummary> {
  return api.get<PreCloseSummary>(`/transit/academic-years/${academicYearId}/pre-close-summary`);
}

/**
 * Closes an academic year and snapshots its records.
 *
 * @param academicYearId - The year to close.
 * @returns The snapshot id and a confirmation message.
 * @throws `ApiError` when the year still has blockers.
 */
export function closeAcademicYear(
  academicYearId: string
): Promise<{ snapshotId: string; message: string }> {
  return api.post<{ snapshotId: string; message: string }>(
    `/transit/academic-years/${academicYearId}/close`
  );
}

/**
 * Reads the closure snapshot of a closed academic year.
 *
 * @param academicYearId - The closed year.
 * @returns The stored snapshot.
 * @throws `ApiError` — `NOT_FOUND` when the year was never closed.
 */
export function getClosureSnapshot(academicYearId: string): Promise<Record<string, unknown>> {
  return api.get<Record<string, unknown>>(`/transit/academic-years/${academicYearId}/snapshot`);
}

// ─── Enrollments ──────────────────────────────────────────────────────────────

/**
 * Opens an active enrollment for one of this school's students.
 *
 * @param payload - Student, class and academic year; term optional.
 * @returns The created enrollment.
 * @throws `ApiError` — `CONFLICT` when the student already has an active enrollment.
 */
export function createEnrollment(payload: CreateEnrollmentPayload): Promise<StudentEnrollment> {
  return api.post<StudentEnrollment>("/transit/enrollments", payload);
}

/**
 * A student's full enrollment history, newest first.
 *
 * @param studentId - The student id (a student record id or their user id).
 * @returns Every enrollment record for that student.
 * @throws `ApiError` — `NOT_FOUND` when the student is not yours and not released to you.
 */
export async function getStudentEnrollmentHistory(studentId: string): Promise<StudentEnrollment[]> {
  const data = await api.get<StudentEnrollment[]>(`/transit/students/${studentId}/enrollments`);
  return Array.isArray(data) ? data : [];
}

/**
 * This school's enrollments, filtered server-side.
 *
 * @param params - Optional class, academic year and status filters.
 * @returns The matching enrollments.
 * @throws `ApiError` when the request fails.
 */
export async function listEnrollments(params?: EnrollmentFilters): Promise<StudentEnrollment[]> {
  const qs = new URLSearchParams();
  if (params?.classId) qs.set("classId", params.classId);
  if (params?.academicYearId) qs.set("academicYearId", params.academicYearId);
  if (params?.status) qs.set("status", params.status);
  const q = qs.toString();
  const data = await api.get<StudentEnrollment[]>(`/transit/enrollments${q ? `?${q}` : ""}`);
  return Array.isArray(data) ? data : [];
}

// ─── School search ────────────────────────────────────────────────────────────

/**
 * Searches every Talim school by name, to pick the other side of a transfer.
 *
 * @param query - The search text.
 * @returns Matching schools, or `[]` for an empty query.
 * @throws `ApiError` when the request fails.
 */
export async function searchSchools(query: string): Promise<SearchSchoolResult[]> {
  if (!query.trim()) return [];
  const body = await api.get<{ data?: SearchSchoolResult[] } | SearchSchoolResult[]>(
    `/schools/search?query=${encodeURIComponent(query)}`
  );
  if (Array.isArray(body)) return body;
  return body?.data ?? [];
}
