/**
 * Who a school-desk ticket can be assigned to: the school admin and the
 * sub-admins holding `manage:support` (the backend refuses anyone else).
 *
 * There is no "desk staff" route, so the list is built from what the viewer
 * can already read, in one request at most:
 * - the primary school admin reads the sub-admins (`GET /sub-admins`, one
 *   page of up to 100) and keeps those with `manage:support`, plus themself;
 * - a sub-admin cannot read that list, so they get themself plus everyone
 *   already assigned on the tickets in view.
 */
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useSchoolId } from "@/hooks/useSchoolId";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { Permission } from "@/lib/permissions";
import { subAdminService } from "@/app/services/sub-admin.service";
import type { TicketRef } from "@/types/tickets";

/** One person a ticket can be assigned to. */
export interface AssigneeOption {
  /** Their user id. */
  value: string;
  /** Their name, with "(you)" for the viewer. */
  label: string;
}

/**
 * Merges people into options: the viewer first, then the rest by name, each
 * once.
 *
 * @param me - The viewer.
 * @param others - Everyone else who can be assigned.
 * @returns The options.
 */
export function assigneeOptions(
  me: TicketRef | null,
  others: readonly TicketRef[]
): AssigneeOption[] {
  const seen = new Set<string>();
  const out: AssigneeOption[] = [];
  if (me?.id) {
    seen.add(me.id);
    out.push({ value: me.id, label: `${me.name || "Me"} (you)` });
  }
  const rest = others
    .filter((person) => person.id && !seen.has(person.id) && (seen.add(person.id), true))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((person) => ({ value: person.id, label: person.name || "Staff member" }));
  return [...out, ...rest];
}

/**
 * The assignee choices for the desk.
 *
 * @param seenAssignees - Assignees on the tickets in view (used for sub-admins).
 * @returns The options, the viewer's id, and whether the list is still loading.
 */
export function useDeskAssignees(seenAssignees: readonly (TicketRef | null | undefined)[] = []): {
  options: AssigneeOption[];
  myId: string;
  isLoading: boolean;
} {
  const { user } = useAuth();
  const { isFullAdmin } = usePermissions();
  const schoolId = useSchoolId();
  const myId = user?.userId ?? "";
  const myName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  const subAdmins = useQuery({
    queryKey: [...queryKeys.subAdmins.list(schoolId ?? "none"), "support-desk"] as const,
    queryFn: () => subAdminService.getSubAdmins(1, 100),
    enabled: Boolean(schoolId) && isFullAdmin,
    staleTime: staleTimes.reference,
  });

  const seenKey = seenAssignees.map((a) => a?.id ?? "").join(",");
  const options = useMemo(() => {
    const desk: TicketRef[] = isFullAdmin
      ? (subAdmins.data?.data ?? [])
          .filter((s) => s.isActive !== false && s.permissions?.includes(Permission.MANAGE_SUPPORT))
          .map((s) => ({ id: s.userId, name: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() }))
      : [];
    const seen = seenAssignees.filter((a): a is TicketRef => Boolean(a?.id));
    return assigneeOptions(myId ? { id: myId, name: myName } : null, [...desk, ...seen]);
    // seenKey stands in for the array's contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullAdmin, subAdmins.data, seenKey, myId, myName]);

  return { options, myId, isLoading: isFullAdmin && subAdmins.isLoading };
}
