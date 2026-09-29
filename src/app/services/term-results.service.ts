/**
 * Term results (Round 3, §21–§23): the class teacher submits a class's
 * results for the term, the office reviews the broadsheet and the remarks,
 * adds the principal's remarks, then publishes (students and parents are
 * notified) or returns them with a reason.
 *
 * Every route here is for staff: a school admin, or a sub-admin holding
 * `manage:assessments` (without it, `FORBIDDEN`). The shapes are the generated
 * contract's, aliased in `@/types/gradingContract`. Every function throws
 * `ApiError`; another school's ids answer `NOT_FOUND`. A 409 carries its
 * machine-readable fields at the top level of the body; read them with
 * `gradingConflict()`.
 */
import { api } from "@/lib/apiClient";
import type {
  Broadsheet,
  PrincipalRemarksPayload,
  ReturnTermResultsPayload,
  TermRemarkRow,
  TermRemarksResponse,
  TermResultCounts,
  TermResultStatus,
  TermResultSubmission,
  TermResultSubmissionDetail,
} from "@/types/gradingContract";

const GRADING = "/grading";

/**
 * The office queue: submissions for a term, optionally of one status,
 * newest first.
 *
 * @param params.termId - The term; the API defaults to the current one.
 * @param params.status - Only submissions in this state.
 * @returns The submissions (an empty list when there are none).
 * @throws `ApiError` — `FORBIDDEN` for a sub-admin without `manage:assessments`.
 */
export const listTermResults = async (
  params: { termId?: string; status?: TermResultStatus } = {}
): Promise<TermResultSubmission[]> => {
  const query = new URLSearchParams();
  if (params.termId) query.set("termId", params.termId);
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  const body = await api.get<TermResultSubmission[] | null>(
    `${GRADING}/term-results${qs ? `?${qs}` : ""}`
  );
  return Array.isArray(body) ? body : [];
};

/**
 * How many submissions of a term are in each status, for the queue's tabs.
 *
 * @param termId - The term; the API defaults to the current one.
 * @returns `{ submitted, returned, published }`.
 * @throws `ApiError` — `FORBIDDEN` for a sub-admin without `manage:assessments`.
 */
export const getTermResultCounts = async (termId?: string): Promise<TermResultCounts> => {
  const query = termId ? `?${new URLSearchParams({ termId })}` : "";
  return api.get<TermResultCounts>(`${GRADING}/term-results/counts${query}`);
};

/**
 * One submission as it stands now: the queue row plus `classId` and `termId`.
 *
 * @param submissionId - The submission.
 * @returns The submission.
 * @throws `ApiError` — `NOT_FOUND` for another school's submission.
 */
export const getTermResult = async (submissionId: string): Promise<TermResultSubmissionDetail> =>
  api.get<TermResultSubmissionDetail>(
    `${GRADING}/term-results/${encodeURIComponent(submissionId)}`
  );

/**
 * A class's broadsheet for a term: one row per student, one column per
 * subject, from published scores only.
 *
 * @param classId - The class.
 * @param params.termId - The term.
 * @param params.basis - `total`, or the assessment id the results were submitted on.
 * @returns The broadsheet.
 * @throws `ApiError` — `NOT_FOUND` for another school's class.
 */
export const getBroadsheet = async (
  classId: string,
  params: { termId: string; basis: string }
): Promise<Broadsheet> => {
  const query = new URLSearchParams({ termId: params.termId, basis: params.basis });
  return api.get<Broadsheet>(
    `${GRADING}/classes/${encodeURIComponent(classId)}/broadsheet?${query}`
  );
};

/**
 * The class teacher's and the principal's remarks for every student of a
 * class in a term.
 *
 * @param classId - The class.
 * @param termId - The term.
 * @returns The rows.
 */
export const getTermRemarks = async (classId: string, termId: string): Promise<TermRemarkRow[]> => {
  const query = new URLSearchParams({ termId });
  const body = await api.get<TermRemarksResponse | null>(
    `${GRADING}/classes/${encodeURIComponent(classId)}/remarks?${query}`
  );
  return body?.rows ?? [];
};

/**
 * Saves the principal's remarks on a submission (staff only). Only the
 * students sent are changed; an empty string clears a remark.
 *
 * @param submissionId - The term-result submission.
 * @param remarks - The remarks, at most 500 characters each.
 * @returns Every student's remarks as saved.
 * @throws `ApiError` — `VALIDATION_FAILED` for a remark that is too long;
 *   409 `{ code: 'RESULTS_PUBLISHED' }` once the class's results for the term
 *   are published (by this submission or another basis's).
 */
export const savePrincipalRemarks = async (
  submissionId: string,
  remarks: PrincipalRemarksPayload["remarks"]
): Promise<TermRemarkRow[]> => {
  const body: PrincipalRemarksPayload = { remarks };
  const saved = await api.put<TermRemarksResponse | null>(
    `${GRADING}/term-results/${encodeURIComponent(submissionId)}/principal-remarks`,
    body
  );
  return saved?.rows ?? [];
};

/**
 * Publishes a submission to the class's students and parents, who are
 * notified.
 *
 * @param submissionId - The submission.
 * @returns The submission, now published.
 * @throws `ApiError` — 409 `{ code: 'ALREADY_PUBLISHED' | 'RETURNED', status }`
 *   unless it is submitted, or 409 `{ waitingOn }` when a subject was
 *   unlocked since the submission.
 */
export const publishTermResults = async (submissionId: string): Promise<TermResultSubmission> =>
  api.post<TermResultSubmission>(
    `${GRADING}/term-results/${encodeURIComponent(submissionId)}/publish`
  );

/**
 * Sends a submission back to the class teacher, who is notified with the
 * reason.
 *
 * @param submissionId - The submission.
 * @param reason - Why it is going back: 1..500 characters after trimming.
 * @returns The submission, now returned.
 * @throws `ApiError` — `VALIDATION_FAILED` without a reason, 409
 *   `{ code: 'ALREADY_PUBLISHED' | 'RETURNED', status }` unless it is submitted.
 */
export const returnTermResults = async (
  submissionId: string,
  reason: string
): Promise<TermResultSubmission> => {
  const body: ReturnTermResultsPayload = { reason };
  return api.post<TermResultSubmission>(
    `${GRADING}/term-results/${encodeURIComponent(submissionId)}/return`,
    body
  );
};
