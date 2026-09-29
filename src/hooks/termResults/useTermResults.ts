/**
 * The term-results queue (Round 3, §21–§23): the office's list of submitted
 * class results, a submission's broadsheet and remarks, and the actions the
 * office takes on it (publish, return, principal's remarks).
 */
"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/components/CustomToast";
import { useSchoolId } from "@/hooks/useSchoolId";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import {
  getBroadsheet,
  getTermRemarks,
  getTermResult,
  getTermResultCounts,
  listTermResults,
  publishTermResults,
  returnTermResults,
  savePrincipalRemarks,
} from "@/app/services/term-results.service";
import {
  gradingConflict,
  type Broadsheet,
  type TermRemarkRow,
  type TermResultCounts,
  type TermResultStatus,
  type TermResultSubmission,
} from "@/types/gradingContract";
import { officeConflictMessage } from "@/components/termResults/termResults.model";

/**
 * Submissions of one status for a term.
 *
 * @param termId - The term ("" waits until one is chosen).
 * @param status - The tab.
 * @returns Query result.
 */
export function useTermResultsQueue(
  termId: string,
  status: TermResultStatus
): UseQueryResult<TermResultSubmission[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.termResults.queue(schoolId ?? "none", termId, status),
    queryFn: () => listTermResults({ termId, status }),
    enabled: Boolean(schoolId && termId),
    staleTime: staleTimes.list,
  });
}

/**
 * How many submissions of a term are in each status, for the tabs.
 *
 * @param termId - The term ("" waits until one is chosen).
 * @returns Query result.
 */
export function useTermResultCounts(termId: string): UseQueryResult<TermResultCounts> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.termResults.counts(schoolId ?? "none", termId),
    queryFn: () => getTermResultCounts(termId),
    enabled: Boolean(schoolId && termId),
    staleTime: staleTimes.list,
  });
}

/**
 * A submission as it stands now. The queue's row shows straight away and is
 * replaced by `GET /grading/term-results/:id` once it answers, so a status
 * another member of staff changed since the queue loaded shows here; the
 * row stays if that read fails.
 *
 * @param row - The submission as the queue listed it.
 * @returns The current submission.
 */
export function useTermResult(row: TermResultSubmission): TermResultSubmission {
  const schoolId = useSchoolId();
  const query = useQuery<TermResultSubmission>({
    queryKey: queryKeys.termResults.detail(schoolId ?? "none", row.id),
    queryFn: () => getTermResult(row.id),
    enabled: Boolean(schoolId),
    placeholderData: row,
    staleTime: staleTimes.list,
  });
  return query.data ?? row;
}

/**
 * The broadsheet a submission was made on.
 *
 * @param submission - The submission.
 * @returns Query result.
 */
export function useBroadsheet(submission: TermResultSubmission): UseQueryResult<Broadsheet> {
  const schoolId = useSchoolId();
  const basis = submission.basis.key;
  return useQuery({
    queryKey: queryKeys.termResults.broadsheet(
      schoolId ?? "none",
      submission.class.id,
      submission.term.id,
      basis
    ),
    queryFn: () => getBroadsheet(submission.class.id, { termId: submission.term.id, basis }),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.list,
  });
}

/**
 * The class teacher's and principal's remarks for a submission's class.
 *
 * @param submission - The submission.
 * @returns Query result.
 */
export function useTermRemarks(submission: TermResultSubmission): UseQueryResult<TermRemarkRow[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.termResults.remarks(
      schoolId ?? "none",
      submission.class.id,
      submission.term.id
    ),
    queryFn: () => getTermRemarks(submission.class.id, submission.term.id),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.list,
  });
}

/**
 * Publish, return and save the principal's remarks, each toasting its
 * outcome. The promises reject with the `ApiError` after the toast, so a
 * dialog can stay open for a retry; the caller reads the 409's fields with
 * `gradingConflict()` to decide whether a retry makes sense.
 *
 * A 409 means the submission, a subject or the remarks changed under the
 * office (another member of staff published or returned it, a teacher
 * unlocked scores, the class's results were published), so every 409 also
 * refreshes the submission, the queue and the broadsheet.
 *
 * @param submission - The submission acted on.
 * @returns The actions and their pending flags.
 */
export function useTermResultActions(submission: TermResultSubmission) {
  const client = useQueryClient();
  const schoolId = useSchoolId() ?? "none";
  const refreshAll = () =>
    client.invalidateQueries({ queryKey: queryKeys.termResults.school(schoolId) });
  const remarksKey = queryKeys.termResults.remarks(
    schoolId,
    submission.class.id,
    submission.term.id
  );

  /** Toasts a failed publish or return, and refreshes what a 409 says has changed. */
  const officeError = (err: unknown, fallback: string) => {
    const conflict = gradingConflict(err);
    if (conflict) void refreshAll();
    toast.error(
      officeConflictMessage(conflict, submission.class.name) ?? getErrorMessage(err, fallback)
    );
  };

  const publish = useMutation({
    mutationFn: () => publishTermResults(submission.id),
    onSuccess: () => {
      toast.success(
        `${submission.class.name} results published. Students and parents are being notified.`
      );
      void refreshAll();
    },
    onError: (err) => {
      logger.error("term-results", "publish failed", err);
      officeError(err, "Failed to publish the results");
    },
  });

  const giveBack = useMutation({
    mutationFn: (reason: string) => returnTermResults(submission.id, reason),
    onSuccess: () => {
      toast.success(`${submission.class.name} results returned to the class teacher.`);
      void refreshAll();
    },
    onError: (err) => {
      logger.error("term-results", "return failed", err);
      officeError(err, "Failed to return the results");
    },
  });

  const saveRemarks = useMutation({
    mutationFn: (remarks: { studentId: string; principalRemark: string }[]) =>
      savePrincipalRemarks(submission.id, remarks),
    onSuccess: (rows, remarks) => {
      // The save answers every student's remarks as stored.
      if (rows.length > 0) client.setQueryData<TermRemarkRow[]>(remarksKey, rows);
      else void client.invalidateQueries({ queryKey: remarksKey });
      toast.success(
        remarks.length === 1 ? "Principal's remark saved" : "Principal's remarks saved"
      );
    },
    onError: (err) => {
      logger.error("term-results", "principal remarks save failed", err);
      if (gradingConflict(err)?.code === "RESULTS_PUBLISHED") {
        void refreshAll();
        toast.error(
          `Not saved: ${submission.class.name}'s results for ${submission.term.name} are published, so the remarks are locked.`
        );
        return;
      }
      toast.error(getErrorMessage(err, "Failed to save the principal's remarks"));
    },
  });

  return {
    publish: () => publish.mutateAsync(),
    returnToTeacher: (reason: string) => giveBack.mutateAsync(reason),
    saveRemarks: (remarks: { studentId: string; principalRemark: string }[]) =>
      saveRemarks.mutateAsync(remarks),
    publishing: publish.isPending,
    returning: giveBack.isPending,
    savingRemarks: saveRemarks.isPending,
  };
}
