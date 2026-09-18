/**
 * The sub-admin list and the three actions that change it.
 *
 * Every sub-admin route is `@Roles(SCHOOL_ADMIN) @Permissions(MANAGE_SUB_ADMINS)`
 * on the backend, so {@link useCanManageSubAdmins} is what the section gates
 * on: a sub-admin holding `manage:sub_admins` is still refused, and the UI
 * must not offer an action the API would reject.
 *
 * The list is a server-paginated query rather than a `useEffect` fetch, so
 * paging back and forth is instant and every mutation invalidates exactly the
 * list it changed.
 */
"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/components/CustomToast";
import { usePermissions } from "@/hooks/usePermissions";
import { useSchoolId } from "@/hooks/useSchoolId";
import { Permission } from "@/lib/permissions";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import {
  subAdminService,
  type PaginatedSubAdmins,
  type SubAdmin,
} from "@/app/services/sub-admin.service";

/** Rows per page of the sub-admin table. */
export const SUB_ADMIN_PAGE_SIZE = 10;

/**
 * Whether the signed-in account may manage sub-admins at all.
 *
 * Both halves are required, exactly as on the backend: the primary school
 * admin role *and* `manage:sub_admins`.
 *
 * @returns True when every sub-admin action is available.
 */
export function useCanManageSubAdmins(): boolean {
  const { isFullAdmin, hasPermission } = usePermissions();
  return isFullAdmin && hasPermission(Permission.MANAGE_SUB_ADMINS);
}

/**
 * One page of the school's sub-admins.
 *
 * @param page - 1-based page number.
 * @param enabled - False for a role that may not read the list at all.
 * @returns Query result.
 */
export function useSubAdmins(page: number, enabled: boolean): UseQueryResult<PaginatedSubAdmins> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: [...queryKeys.subAdmins.list(schoolId ?? "none"), page] as const,
    queryFn: () => subAdminService.getSubAdmins(page, SUB_ADMIN_PAGE_SIZE),
    enabled: enabled && Boolean(schoolId),
    staleTime: staleTimes.list,
    placeholderData: (previous) => previous,
  });
}

/** What {@link useSubAdminActions} returns. */
export interface SubAdminActions {
  /** Refreshes every page of the list — after a create or a promotion. */
  refreshList: () => void;
  /** Suspends or reactivates a sub-admin, whichever they are not. */
  toggleStatus: (subAdmin: SubAdmin) => Promise<void>;
  /** Removes a sub-admin, returning a promoted teacher to their old role. */
  demote: (subAdmin: SubAdmin) => Promise<void>;
  /** True while either action is in flight. */
  isActioning: boolean;
}

/**
 * The status and removal actions, each invalidating the list afterwards.
 *
 * @returns The actions and their pending flag.
 */
export function useSubAdminActions(): SubAdminActions {
  const client = useQueryClient();
  const schoolId = useSchoolId();

  const refreshList = () => {
    void client.invalidateQueries({ queryKey: queryKeys.subAdmins.list(schoolId ?? "none") });
  };

  const toggle = useMutation({
    mutationFn: (subAdmin: SubAdmin) => subAdminService.toggleStatus(subAdmin.userId),
    onSuccess: (updated) => {
      refreshList();
      toast.success(
        `${updated.firstName} ${updated.lastName} is now ${updated.isActive ? "active" : "suspended"}`
      );
    },
    onError: (err) => {
      logger.error("sub-admins/toggle-status", "status change failed", err);
      toast.error(getErrorMessage(err, "Failed to update status"));
    },
  });

  const demote = useMutation({
    mutationFn: (subAdmin: SubAdmin) => subAdminService.demoteSubAdmin(subAdmin.userId),
    onSuccess: (_result, subAdmin) => {
      refreshList();
      toast.success(`${subAdmin.firstName} ${subAdmin.lastName} has been removed as sub-admin`);
    },
    onError: (err) => {
      logger.error("sub-admins/demote", "removal failed", err);
      toast.error(getErrorMessage(err, "Failed to remove sub-admin"));
    },
  });

  return {
    refreshList,
    toggleStatus: async (subAdmin) => {
      await toggle.mutateAsync(subAdmin).catch(() => undefined);
    },
    demote: async (subAdmin) => {
      await demote.mutateAsync(subAdmin).catch(() => undefined);
    },
    isActioning: toggle.isPending || demote.isPending,
  };
}
