"use client";

/**
 * Cached queries and mutations for the assessments screen.
 *
 * The list is paged server-side, so the page number is part of the key: moving
 * between pages is cached, and every mutation invalidates the whole assessment
 * list rather than refetching one page by hand.
 */
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import {
  assessmentService,
  type AssessmentsResponse,
  type CreateAssessmentRequest,
  type UpdateAssessmentRequest,
} from "@/app/services/assessment.service";

/**
 * Keys for the assessment resources.
 *
 * They follow the `[resource, schoolId, …]` shape the rest of the app uses, so
 * signing into another school never reuses them.
 */
export const assessmentKeys = {
  all: ["assessments"] as const,
  /** One page of the school's assessments. */
  list: (schoolId: string, page: number, limit: number) =>
    ["assessments", schoolId, "list", { page, limit }] as const,
} as const;

/**
 * One page of the school's assessments.
 *
 * @param page - 1-based page number.
 * @param limit - Rows per page.
 * @returns Query result; `data` is undefined until it loads.
 */
export function useAssessments(page: number, limit: number): UseQueryResult<AssessmentsResponse> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: assessmentKeys.list(schoolId ?? "none", page, limit),
    queryFn: () => assessmentService.getAssessmentsBySchool(page, limit),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.list,
    // Keeping the previous page on screen while the next one loads stops the
    // list from collapsing to an empty state between pages.
    placeholderData: (previous) => previous,
  });
}

/**
 * Create, edit and deactivate assessments.
 *
 * Each mutation invalidates every page of the list, so a new assessment shows
 * up whichever page the administrator is on.
 *
 * @returns The three mutations, each with `mutateAsync` and `isPending`.
 */
export function useAssessmentMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: assessmentKeys.all });

  return {
    create: useMutation({
      mutationFn: (payload: CreateAssessmentRequest) => assessmentService.createAssessment(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: UpdateAssessmentRequest }) =>
        assessmentService.updateAssessment(id, payload),
      onSuccess: invalidate,
    }),
    /** A soft delete on the backend — the assessment is hidden from teachers. */
    deactivate: useMutation({
      mutationFn: (id: string) => assessmentService.deleteAssessment(id),
      onSuccess: invalidate,
    }),
  };
}
