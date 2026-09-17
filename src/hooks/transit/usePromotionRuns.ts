/** Cached promotion runs and the validate / commit / cancel transitions. */
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import { transitKeys } from "@/hooks/transit/keys";
import {
  cancelPromotionRun,
  commitPromotionRun,
  createPromotionRun,
  getPromotionRun,
  listPromotionRuns,
  validatePromotionRun,
  type CreatePromotionRunPayload,
  type PromotionRun,
} from "@/app/services/transit.service";

/**
 * The school's promotion runs.
 *
 * @param status - Optional status filter, applied by the API.
 * @returns Query result.
 */
export function usePromotionRuns(status?: string): UseQueryResult<PromotionRun[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: transitKeys.promotionList(schoolId ?? "none", status),
    queryFn: () => listPromotionRuns(status || undefined),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.list,
    placeholderData: (previous) => previous,
  });
}

/**
 * One promotion run, with its decisions — fetched only while a drawer is open.
 *
 * @param id - The run id, or `null` when nothing is open.
 * @returns Query result.
 */
export function usePromotionRun(id: string | null): UseQueryResult<PromotionRun> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: transitKeys.promotionRun(schoolId ?? "none", id ?? "none"),
    queryFn: () => getPromotionRun(id as string),
    enabled: Boolean(schoolId && id),
    staleTime: staleTimes.list,
  });
}

/** The transitions a promotion run accepts. */
export type PromotionAction = "validate" | "commit" | "cancel";

/** What `usePromotionRunAction` is asked to do. */
export interface PromotionActionInput {
  id: string;
  action: PromotionAction;
}

/**
 * Validates, commits or cancels a run.
 *
 * A commit rewrites classes and enrollments, so it invalidates the enrollment
 * lists and the dashboard as well as the runs themselves.
 *
 * @returns Mutation result; `mutateAsync` takes the run id and the action.
 */
export function usePromotionRunAction(): UseMutationResult<
  PromotionRun,
  unknown,
  PromotionActionInput
> {
  const schoolId = useSchoolId();
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: PromotionActionInput) => {
      if (action === "validate") return validatePromotionRun(id);
      if (action === "commit") return commitPromotionRun(id);
      return cancelPromotionRun(id);
    },
    onSuccess: (updated, { id, action }) => {
      const school = schoolId ?? "none";
      client.setQueryData(transitKeys.promotionRun(school, id), updated);
      client.invalidateQueries({ queryKey: transitKeys.promotions(school) });
      client.invalidateQueries({ queryKey: transitKeys.dashboard(school) });
      if (action === "commit") {
        client.invalidateQueries({ queryKey: transitKeys.enrollments(school) });
      }
    },
  });
}

/**
 * Creates a run; the API validates it in the same call.
 *
 * @returns Mutation result; `mutateAsync` takes the run payload.
 */
export function useCreatePromotionRun(): UseMutationResult<
  PromotionRun,
  unknown,
  CreatePromotionRunPayload
> {
  const schoolId = useSchoolId();
  const client = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePromotionRunPayload) => createPromotionRun(payload),
    onSuccess: () => {
      const school = schoolId ?? "none";
      client.invalidateQueries({ queryKey: transitKeys.promotions(school) });
      client.invalidateQueries({ queryKey: transitKeys.dashboard(school) });
    },
  });
}
