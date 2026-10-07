"use client";

import React from "react";
import { Pill } from "@/components/tl/bits";
import type { TicketPriority, TicketStatus } from "@/types/tickets";
import { priorityMeta, statusLabel, statusTone, type TicketViewer } from "./ticket.presentation";

/**
 * A ticket's status as a pill, in the reader's words ("Waiting on you" for
 * the requester, "Waiting on requester" at the desk).
 *
 * @param props - The status and who is reading.
 * @param props.status - The status.
 * @param props.viewer - Desk staff or the requester.
 * @returns The pill.
 */
export function TicketStatusPill({
  status,
  viewer = "desk",
}: {
  status: TicketStatus;
  viewer?: TicketViewer;
}) {
  return (
    <Pill tone={statusTone(status)} dot>
      {statusLabel(status, viewer)}
    </Pill>
  );
}

/**
 * A ticket's priority as a pill.
 *
 * @param props - The priority.
 * @param props.priority - The priority.
 * @returns The pill.
 */
export function TicketPriorityPill({ priority }: { priority: TicketPriority }) {
  const { label, tone } = priorityMeta(priority);
  return <Pill tone={tone}>{label} priority</Pill>;
}
