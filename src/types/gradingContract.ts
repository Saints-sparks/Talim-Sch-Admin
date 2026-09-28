/**
 * Round 3 (Grading) API types, WRITTEN BY HAND.
 *
 * Source: `talimBE-V2/docs/redesign-teachers-today-timetable.md`, "Round 3"
 * (§15 assessment max score, §16 grade scale, §21 broadsheet, §22 term
 * remarks, §23 term results). The backend is being built alongside this app,
 * so the generated contract (`./api.d.ts`) does not describe these fields and
 * routes yet.
 *
 * When `npm run types:api` brings the generated DTOs, replace each type here
 * with its `Schema<"…">` / `RequestBody<…>` / `ResponseBody<…>` alias, delete
 * what is left, and let `tsc` point at every place the two disagree.
 */

// ─── §15 Assessment max score ─────────────────────────────────────────────────

/** Lowest max score an assessment may have (§15). */
export const MAX_SCORE_MIN = 1;
/** Highest max score an assessment may have (§15). */
export const MAX_SCORE_MAX = 1000;

/**
 * §15: `POST /assessments` requires `maxScore` (1..1000). Intersected with the
 * generated `CreateAssessmentDto` in `apiPayloads.ts`.
 */
export interface CreateAssessmentMaxScore {
  maxScore: number;
}

/**
 * §15: `PUT /assessments/:id` accepts `maxScore`. Changing it once any course
 * has published scores for the assessment answers 409.
 */
export interface UpdateAssessmentMaxScore {
  maxScore?: number;
}

// ─── §16 Grade scale and pass mark ────────────────────────────────────────────

/** One band of a school's grade scale: `min` is the lowest percent that earns `letter`. */
export interface GradeBand {
  letter: string;
  /** Percent, 0..100, inclusive lower bound. */
  min: number;
  /** Optional word printed beside the letter, e.g. "Excellent". */
  remark?: string | null;
}

/**
 * §16 fields `GET /settings/academic` adds to `AcademicSettingsDto`. The API
 * fills in the defaults, so both are always present once Round 3 is deployed;
 * they are optional here only so an older API that omits them does not crash
 * the form (it falls back to the defaults).
 */
export interface AcademicGradingFields {
  /** Bands with strictly descending `min`; the last `min` is 0. */
  gradeScale?: GradeBand[];
  /** Percent, default 50. */
  passMark?: number;
}

/**
 * §16 fields `PATCH /settings/academic` accepts. The API checks: unique
 * letters, strictly descending `min`, and a last `min` of 0.
 */
export interface UpdateAcademicGradingFields {
  gradeScale?: { letter: string; min: number; remark?: string }[];
  passMark?: number;
}

// ─── Shared shapes ────────────────────────────────────────────────────────────

/** `{ id, name }` references the grading routes return. */
export interface NamedRef {
  id: string;
  name: string;
}

/** A student as the broadsheet and remarks routes return one. */
export interface ResultStudent {
  id: string;
  name: string;
  admissionNumber: string | null;
}

/** Standard competition rank: ties share a rank (1, 1, 3). */
export interface ResultPosition {
  rank: number;
  of: number;
}

// ─── §21 Broadsheet ───────────────────────────────────────────────────────────

/**
 * `GET /grading/classes/:classId/broadsheet?termId=&basis=<assessmentId>|total`
 * (class teacher and staff). Published scores only.
 */
export interface Broadsheet {
  class: NamedRef;
  term: NamedRef;
  basis: {
    /** `total` or an assessment id. */
    key: string;
    label: string;
    /** The assessment's max score; null for `total`, where cells are percents. */
    maxPerSubject: number | null;
  };
  subjects: { courseId: string; code: string; title: string; published: boolean }[];
  rows: {
    student: ResultStudent;
    /** One per subject, in `subjects` order; null when not published or not entered. */
    cells: (number | null)[];
    total: number | null;
    /** Percent over the published subjects. */
    average: number | null;
    position: ResultPosition | null;
    grade: string | null;
    publishedCount: number;
  }[];
  /** True when every subject has published scores for the basis. */
  ready: boolean;
  waitingOn: { courseId: string; title: string }[];
}

// ─── §22 Term remarks ─────────────────────────────────────────────────────────

/** One row of `GET /grading/classes/:classId/remarks?termId=`. */
export interface TermRemarkRow {
  student: ResultStudent;
  position: ResultPosition | null;
  average: number | null;
  publishedCount: number;
  subjectCount: number;
  /** Written by the class teacher; at most 500 characters. */
  classTeacherRemark: string | null;
  /** Written by the office (staff); at most 500 characters. */
  principalRemark: string | null;
}

/** Body of `GET /grading/classes/:classId/remarks`. */
export interface TermRemarksResponse {
  rows: TermRemarkRow[];
}

/** Longest remark the API stores (§22). */
export const REMARK_MAX_LENGTH = 500;

/** Body of `PUT /grading/term-results/:id/principal-remarks` (staff only). */
export interface PrincipalRemarksPayload {
  remarks: { studentId: string; principalRemark: string }[];
}

// ─── §23 Term results ─────────────────────────────────────────────────────────

/** Where a class's term results are: with the office, back with the class teacher, or out. */
export type TermResultStatus = "submitted" | "returned" | "published";

/**
 * One row of the office queue `GET /grading/term-results?termId=&status=`
 * (staff; sub-admins need `manage:assessments`).
 *
 * The contract lists `{ id, class, term, basis, status, submittedAt,
 * submittedBy, studentCount, missingRemarks }` without spelling out `basis`
 * and `submittedBy`; both are read through the normalisers in
 * `components/termResults/termResults.model.ts`, which accept either the raw
 * value or the `{ key, label }` / `{ id, name }` object the other grading
 * routes use. The return and publish fields are optional extras the model
 * stores (§23) and the queue shows when the API sends them.
 */
export interface TermResultSubmission {
  id: string;
  class: NamedRef;
  term: NamedRef;
  /** `'total'` or an assessment id, or `{ key, label }`. */
  basis: string | { key: string; label: string };
  status: TermResultStatus;
  submittedAt: string;
  /** A user id, or `{ id, name }`. */
  submittedBy: string | NamedRef | null;
  studentCount: number;
  /** Students still without a class teacher remark. */
  missingRemarks: number;
  returnedAt?: string | null;
  returnReason?: string | null;
  publishedAt?: string | null;
}

/** Body of `POST /grading/term-results/:id/return` (staff). */
export interface ReturnTermResultsPayload {
  reason: string;
}
