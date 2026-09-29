/**
 * Round 3 (Grading) types: aliases of the generated contract (`./api.d.ts`,
 * refreshed with `npm run types:api`), so `tsc` flags any drift from the
 * backend DTOs.
 *
 * Source: `talimBE-V2/docs/redesign-teachers-today-timetable.md`, "Round 3"
 * (§15 assessment max score, §16 grade scale, §21 broadsheet, §22 term
 * remarks, §23 term results) and "Round 3 as built", which wins where the two
 * differ.
 *
 * Hand-written here, because Swagger does not carry them:
 * - the limits the DTO validators enforce (the constants below);
 * - the 409 bodies. Swagger documents each 409 only as a description, while
 *   the API puts machine-readable fields at the top level of the error body
 *   beside `error.code: 'CONFLICT'` (see {@link GradingConflict}).
 */
import { ApiError } from "@/lib/apiError";
import type { RequestBody, Schema } from "./apiContract";

// ─── §15 Assessment max score ─────────────────────────────────────────────────

/** Lowest max score an assessment may have: a whole number (§15, `CreateAssessmentDto`). */
export const MAX_SCORE_MIN = 1;
/** Highest max score an assessment may have (§15). */
export const MAX_SCORE_MAX = 1000;

// ─── §16 Grade scale and pass mark ────────────────────────────────────────────

/**
 * One band of a school's grade scale as `GET /settings/academic` answers it:
 * `min` is the lowest percent that earns `letter`; `remark` is null when unset.
 */
export type GradeBand = Schema<"GradeScaleBandResponseDto">;

/** One band as `PATCH /settings/academic` takes it (`remark` optional). */
export type GradeBandInput = Schema<"GradeScaleBandDto">;

// ─── Shared shapes ────────────────────────────────────────────────────────────

/** `{ id, name }` of a person the grading routes name (their login id). */
export type GradingPerson = Schema<"GradingPersonDto">;

/** A student as the broadsheet and remarks routes return one. */
export type ResultStudent = Schema<"BroadsheetStudentDto">;

/** Standard competition rank: ties share a rank (1, 1, 3). */
export type ResultPosition = Schema<"GradingPositionDto">;

/** A subject whose scores for the basis are not published (yet, or since an unlock). */
export type WaitingSubject = Schema<"BroadsheetWaitingDto">;

// ─── §21 Broadsheet ───────────────────────────────────────────────────────────

/**
 * `GET /grading/classes/:classId/broadsheet?termId=&basis=<assessmentId>|total`
 * (class teacher and staff). Published scores only; carries the school's
 * `scale` and `passMark`.
 */
export type Broadsheet = Schema<"BroadsheetDto">;

// ─── §22 Term remarks ─────────────────────────────────────────────────────────

/**
 * One row of `GET /grading/classes/:classId/remarks?termId=`. A remark not
 * written is `''`, never null.
 */
export type TermRemarkRow = Schema<"TermRemarkRowDto">;

/** Body of `GET /grading/classes/:classId/remarks` and of the principal-remarks save. */
export type TermRemarksResponse = Schema<"TermRemarksDto">;

/** Longest remark the API stores (§22, `@MaxLength(500)`). */
export const REMARK_MAX_LENGTH = 500;

/** Body of `PUT /grading/term-results/:id/principal-remarks` (staff only). */
export type PrincipalRemarksPayload = RequestBody<
  "/grading/term-results/{id}/principal-remarks",
  "put"
>;

// ─── §23 Term results ─────────────────────────────────────────────────────────

/**
 * One submission, as the office queue `GET /grading/term-results?termId=&status=`
 * lists it (staff; sub-admins need `manage:assessments`) and as publish and
 * return answer it. `basis` is `{ key, label }`; every `*By` is `{ id, name } | null`.
 */
export type TermResultSubmission = Schema<"TermResultSubmissionDto">;

/** `GET /grading/term-results/:id`: the queue row plus `classId` and `termId`. */
export type TermResultSubmissionDetail = Schema<"TermResultSubmissionDetailDto">;

/** Where a class's term results are: with the office, back with the class teacher, or out. */
export type TermResultStatus = TermResultSubmission["status"];

/** `GET /grading/term-results/counts?termId=`: how many submissions are in each status. */
export type TermResultCounts = Schema<"TermResultCountsDto">;

/** Body of `POST /grading/term-results/:id/return` (staff). */
export type ReturnTermResultsPayload = RequestBody<"/grading/term-results/{id}/return", "post">;

/** Longest return reason the API takes, after trimming (§23 as built: 1..500). */
export const RETURN_REASON_MAX_LENGTH = 500;

// ─── 409 bodies (not in Swagger) ──────────────────────────────────────────────

/** The sub-codes a grading 409 carries at the top level of its body. */
export type GradingConflictCode =
  | "LOCKED"
  | "NOT_PUBLISHED"
  | "PUBLISHED"
  | "SCORES_ABOVE_MAX"
  | "ALREADY_REMINDED"
  | "NO_TEACHER"
  | "RESULTS_SUBMITTED"
  | "RESULTS_PUBLISHED"
  | "ALREADY_SUBMITTED"
  | "ALREADY_PUBLISHED"
  | "RETURNED";

/**
 * The machine-readable fields of a grading 409 (Round 3 as built,
 * "Everywhere"). Each is present only on the 409s that use it.
 */
export interface GradingConflict {
  /** Why it conflicts; absent on the `missing` and `waitingOn` 409s. */
  code?: GradingConflictCode;
  /** Active students without a valid score (score publish). */
  missing?: string[];
  /** Subjects not published for the basis (term results submit and publish). */
  waitingOn?: WaitingSubject[];
  /** When the earlier reminder went (`ALREADY_REMINDED`). */
  sentAt?: string;
  /** Where the submission stands (term results publish and return). */
  status?: TermResultStatus;
  /** The highest recorded score (`SCORES_ABOVE_MAX`, assessment max score change). */
  highestScore?: number;
}

/**
 * Reads the grading fields of a 409.
 *
 * @param error - What a call threw.
 * @returns The fields, or null when it is not a 409 `ApiError`.
 */
export function gradingConflict(error: unknown): GradingConflict | null {
  if (!(error instanceof ApiError) || (error.status !== 409 && error.code !== "CONFLICT"))
    return null;
  const { code, missing, waitingOn, sentAt, status, highestScore } = error.meta;
  return {
    ...(typeof code === "string" ? { code: code as GradingConflictCode } : {}),
    ...(Array.isArray(missing) ? { missing: missing.map(String) } : {}),
    ...(Array.isArray(waitingOn) ? { waitingOn: waitingOn as WaitingSubject[] } : {}),
    ...(typeof sentAt === "string" ? { sentAt } : {}),
    ...(typeof status === "string" ? { status: status as TermResultStatus } : {}),
    ...(typeof highestScore === "number" ? { highestScore } : {}),
  };
}
