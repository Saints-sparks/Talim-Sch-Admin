/**
 * Cached reads and guarded writes for school-to-school transfers.
 *
 * Every transition invalidates both the transfer it changed and the lists and
 * counters that show it, so a page never renders a stale status next to an
 * action the API has already refused.
 */
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
  acceptTransfer,
  cancelTransfer,
  createTransfer,
  getTransfer,
  listTransfers,
  rejectTransfer,
  sourceApproveTransfer,
  targetApproveTransfer,
  type CreateTransferPayload,
  type TransferRequest,
} from "@/app/services/transit.service";

/**
 * The school's transfers, incoming and outgoing.
 *
 * @param status - Optional status filter; the API does the filtering.
 * @returns Query result; `data` is undefined until it loads.
 */
export function useTransfers(status?: string): UseQueryResult<TransferRequest[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: transitKeys.transferList(schoolId ?? "none", status),
    queryFn: () => listTransfers(status || undefined),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.list,
  });
}

/**
 * One transfer request.
 *
 * @param id - The transfer id.
 * @returns Query result.
 */
export function useTransfer(id: string): UseQueryResult<TransferRequest> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: transitKeys.transfer(schoolId ?? "none", id),
    queryFn: () => getTransfer(id),
    enabled: Boolean(schoolId && id),
    staleTime: staleTimes.list,
  });
}

/** The transitions one transfer accepts, named as the API names them. */
export type TransferAction =
  | { type: "source-approve" }
  | { type: "target-approve" }
  | { type: "accept" }
  | { type: "reject"; reason?: string }
  | { type: "cancel"; reason?: string };

/** Runs a transfer transition and refreshes what it changed. */
function runAction(id: string, action: TransferAction): Promise<TransferRequest> {
  switch (action.type) {
    case "source-approve":
      return sourceApproveTransfer(id);
    case "target-approve":
      return targetApproveTransfer(id);
    case "accept":
      return acceptTransfer(id);
    case "reject":
      return rejectTransfer(id, action.reason);
    case "cancel":
      return cancelTransfer(id, action.reason);
  }
}

/**
 * Moves a transfer through the state machine.
 *
 * On success the updated transfer is written straight into the detail cache and
 * the transfer lists, the dashboard counters and — for an acceptance, which
 * creates an enrollment — the enrollment lists are invalidated.
 *
 * @param id - The transfer being acted on.
 * @returns Mutation result; `mutateAsync` takes the action to run.
 */
export function useTransferAction(
  id: string
): UseMutationResult<TransferRequest, unknown, TransferAction> {
  const schoolId = useSchoolId();
  const client = useQueryClient();

  return useMutation({
    mutationFn: (action: TransferAction) => runAction(id, action),
    onSuccess: (updated, action) => {
      const school = schoolId ?? "none";
      client.setQueryData(transitKeys.transfer(school, id), updated);
      client.invalidateQueries({ queryKey: transitKeys.transfers(school) });
      client.invalidateQueries({ queryKey: transitKeys.dashboard(school) });
      if (action.type === "accept") {
        client.invalidateQueries({ queryKey: transitKeys.enrollments(school) });
      }
    },
  });
}

/**
 * Opens a transfer request, pushing a student out or pulling one in.
 *
 * @returns Mutation result; `mutateAsync` takes the request payload.
 */
export function useCreateTransfer(): UseMutationResult<
  TransferRequest,
  unknown,
  CreateTransferPayload
> {
  const schoolId = useSchoolId();
  const client = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTransferPayload) => createTransfer(payload),
    onSuccess: () => {
      const school = schoolId ?? "none";
      client.invalidateQueries({ queryKey: transitKeys.transfers(school) });
      client.invalidateQueries({ queryKey: transitKeys.dashboard(school) });
    },
  });
}
