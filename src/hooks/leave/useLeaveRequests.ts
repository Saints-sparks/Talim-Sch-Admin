/**
 * Leave-request data for the review queue and the detail screen.
 *
 * The API hands back the school's whole queue in one response, so the list is
 * cached once per school and the filter tabs work on what is already in the
 * cache — there is no per-tab request to make. A decision invalidates both the
 * list and that request's detail entry, so the two screens can never disagree
 * about whether something is still pending.
 */
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import {
  getLeaveRequestById,
  getLeaveRequests,
  updateLeaveRequestStatus,
  type LeaveRequest,
  type UpdateLeaveStatusPayload,
} from "@/app/services/leave.service";

/** What a decision mutation is given. */
export interface LeaveDecision extends UpdateLeaveStatusPayload {
  leaveId: string;
}

/**
 * Every leave request in the signed-in administrator's school.
 *
 * @returns Query result; `data` is undefined until the queue lands.
 */
export function useLeaveRequests(): UseQueryResult<LeaveRequest[]> {
  const schoolId = useSchoolId();

  return useQuery({
    queryKey: queryKeys.leaveRequests.list(schoolId ?? "none"),
    queryFn: getLeaveRequests,
    enabled: Boolean(schoolId),
    staleTime: staleTimes.list,
  });
}

/**
 * One leave request, with the student and parent details the decision needs.
 *
 * @param leaveId - The leave request's id, or an empty string while the route
 *   param is still resolving.
 * @returns Query result.
 */
export function useLeaveRequest(leaveId: string): UseQueryResult<LeaveRequest> {
  const schoolId = useSchoolId();

  return useQuery({
    queryKey: queryKeys.leaveRequests.detail(schoolId ?? "none", leaveId),
    queryFn: () => getLeaveRequestById(leaveId),
    enabled: Boolean(schoolId && leaveId),
    staleTime: staleTimes.list,
  });
}

/**
 * Approves or rejects a leave request.
 *
 * @returns Mutation whose success drops the cached queue and the request's own
 *   detail entry.
 */
export function useUpdateLeaveStatus(): UseMutationResult<LeaveRequest, Error, LeaveDecision> {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ leaveId, ...payload }: LeaveDecision) =>
      updateLeaveRequestStatus(leaveId, payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.leaveRequests.all }),
  });
}
