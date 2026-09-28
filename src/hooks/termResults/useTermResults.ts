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
  listTermResults,
  publishTermResults,
  returnTermResults,
  savePrincipalRemarks,
} from "@/app/services/term-results.service";
import type {
  Broadsheet,
  TermRemarkRow,
  TermResultStatus,
  TermResultSubmission,
} from "@/types/gradingContract";
import { basisKey } from "@/components/termResults/termResults.model";

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
 * The broadsheet a submission was made on.
 *
 * @param submission - The submission.
 * @returns Query result.
 */
export function useBroadsheet(submission: TermResultSubmission): UseQueryResult<Broadsheet> {
  const schoolId = useSchoolId();
  const basis = basisKey(submission.basis);
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
 * dialog can stay open for a retry.
 *
 * @param submission - The submission acted on.
 * @returns The actions and their pending flags.
 */
export function useTermResultActions(submission: TermResultSubmission) {
  const client = useQueryClient();
  const schoolId = useSchoolId() ?? "none";
  const refreshQueue = () =>
    client.invalidateQueries({ queryKey: queryKeys.termResults.school(schoolId) });
  const remarksKey = queryKeys.termResults.remarks(
    schoolId,
    submission.class.id,
    submission.term.id
  );

  const publish = useMutation({
    mutationFn: () => publishTermResults(submission.id),
    onSuccess: () => {
      toast.success(
        `${submission.class.name} results published. Students and parents are being notified.`
      );
      void refreshQueue();
    },
    onError: (err) => {
      logger.error("term-results", "publish failed", err);
      toast.error(getErrorMessage(err, "Failed to publish the results"));
    },
  });

  const giveBack = useMutation({
    mutationFn: (reason: string) => returnTermResults(submission.id, reason),
    onSuccess: () => {
      toast.success(`${submission.class.name} results returned to the class teacher.`);
      void refreshQueue();
    },
    onError: (err) => {
      logger.error("term-results", "return failed", err);
      toast.error(getErrorMessage(err, "Failed to return the results"));
    },
  });

  const saveRemarks = useMutation({
    mutationFn: (remarks: { studentId: string; principalRemark: string }[]) =>
      savePrincipalRemarks(submission.id, remarks),
    onSuccess: (_data, remarks) => {
      // Show what was saved straight away rather than the old text until the refetch lands.
      const saved = new Map(remarks.map((r) => [r.studentId, r.principalRemark]));
      client.setQueryData<TermRemarkRow[]>(remarksKey, (rows) =>
        rows?.map((row) =>
          saved.has(row.student.id)
            ? { ...row, principalRemark: saved.get(row.student.id) || null }
            : row
        )
      );
      void client.invalidateQueries({ queryKey: remarksKey });
      toast.success(
        remarks.length === 1 ? "Principal's remark saved" : "Principal's remarks saved"
      );
    },
    onError: (err) => {
      logger.error("term-results", "principal remarks save failed", err);
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
