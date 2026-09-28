/**
 * Term results (Round 3, §21–§23): the class teacher submits a class's
 * results for the term, the office reviews the broadsheet and the remarks,
 * adds the principal's remarks, then publishes (students and parents are
 * notified) or returns them with a reason.
 *
 * Every route here is for staff; a sub-admin needs `manage:assessments` for
 * the queue. The shapes are hand-written in `@/types/gradingContract` until
 * the generated contract has them. Every function throws `ApiError`; another
 * school's ids answer `NOT_FOUND`.
 */
import { api } from "@/lib/apiClient";
import type {
  Broadsheet,
  PrincipalRemarksPayload,
  ReturnTermResultsPayload,
  TermRemarkRow,
  TermRemarksResponse,
  TermResultStatus,
  TermResultSubmission,
} from "@/types/gradingContract";

const GRADING = "/grading";

/**
 * The office queue: submissions for a term, optionally of one status.
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
 * @throws `ApiError` — `VALIDATION_FAILED` for a remark that is too long.
 */
export const savePrincipalRemarks = async (
  submissionId: string,
  remarks: PrincipalRemarksPayload["remarks"]
): Promise<void> => {
  const body: PrincipalRemarksPayload = { remarks };
  await api.put<unknown>(
    `${GRADING}/term-results/${encodeURIComponent(submissionId)}/principal-remarks`,
    body
  );
};

/**
 * Publishes a submission to the class's students and parents, who are
 * notified.
 *
 * @param submissionId - The submission.
 * @returns The submission as the API returns it.
 * @throws `ApiError` — `CONFLICT` when it is not in a publishable state.
 */
export const publishTermResults = async (submissionId: string): Promise<unknown> =>
  api.post<unknown>(`${GRADING}/term-results/${encodeURIComponent(submissionId)}/publish`);

/**
 * Sends a submission back to the class teacher, who is notified with the
 * reason.
 *
 * @param submissionId - The submission.
 * @param reason - Why it is going back; required.
 * @returns The submission as the API returns it.
 * @throws `ApiError` — `VALIDATION_FAILED` without a reason, `CONFLICT` when
 *   it is not in a returnable state.
 */
export const returnTermResults = async (submissionId: string, reason: string): Promise<unknown> => {
  const body: ReturnTermResultsPayload = { reason };
  return api.post<unknown>(
    `${GRADING}/term-results/${encodeURIComponent(submissionId)}/return`,
    body
  );
};
