/**
 * Who a school-desk ticket can be assigned to: the school's admins and the
 * sub-admins holding `manage:support` (the backend refuses anyone else),
 * read in one request from `GET /tickets/desk/school/staff`, which school
 * admins and desk sub-admins may both call. Assignees already on the
 * tickets in view are merged in, so a ticket's current assignee is always a
 * choice even while the list loads.
 */
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useSchoolId } from "@/hooks/useSchoolId";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { ticketService } from "@/app/services/ticket.service";
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
 * @param seenAssignees - Assignees on the tickets in view, merged in.
 * @returns The options, the viewer's id, and whether the list is still loading.
 */
export function useDeskAssignees(seenAssignees: readonly (TicketRef | null | undefined)[] = []): {
  options: AssigneeOption[];
  myId: string;
  isLoading: boolean;
} {
  const { user } = useAuth();
  const schoolId = useSchoolId();
  const myId = user?.userId ?? "";
  const myName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  const staff = useQuery({
    queryKey: queryKeys.tickets.deskStaff(schoolId ?? "none"),
    queryFn: () => ticketService.schoolDeskStaff(),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.reference,
  });

  const seenKey = seenAssignees.map((a) => a?.id ?? "").join(",");
  const options = useMemo(() => {
    const desk: TicketRef[] = (staff.data ?? []).map((member) => ({
      id: member.id,
      name: member.name,
    }));
    const seen = seenAssignees.filter((a): a is TicketRef => Boolean(a?.id));
    return assigneeOptions(myId ? { id: myId, name: myName } : null, [...desk, ...seen]);
    // seenKey stands in for the array's contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff.data, seenKey, myId, myName]);

  return { options, myId, isLoading: staff.isLoading };
}
