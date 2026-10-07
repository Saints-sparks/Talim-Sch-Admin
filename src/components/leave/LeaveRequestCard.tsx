"use client";

/**
 * One leave request in the review queue.
 *
 * The card opens the full request; the Approve / Reject pair decides it in
 * place without leaving the queue, which is what the pending tab is for.
 */
import React from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { Pill } from "@/components/tl/bits";
import { card, focusRing } from "@/components/tl/styles";
import type { LeaveRequest } from "@/app/services/leave.service";
import { LeaveDecisionActions } from "./LeaveDecisionActions";
import {
  FALLBACK_AVATAR,
  STATUS_TONE,
  formatDate,
  leaveTypeLabel,
  statusKey,
  studentAvatar,
  studentName,
} from "./leave.presentation";

interface LeaveRequestCardProps {
  request: LeaveRequest;
  onOpen: (leaveId: string) => void;
  onApprove: (leaveId: string) => void;
  onReject: (leaveId: string) => void;
  /** True while this card's own decision is in flight. */
  isDeciding: boolean;
}

/**
 * Renders one queue card: who, the status pill, the leave type, dates and
 * attachments, the reason, and Approve / Reject while pending.
 *
 * @param props - The request, the open handler and the decision handlers.
 * @param props.request - The request.
 * @param props.onOpen - Opens it.
 * @param props.onApprove - Approves it.
 * @param props.onReject - Rejects it.
 * @param props.isDeciding - Whether its decision is in flight.
 * @returns The card.
 */
export function LeaveRequestCard({
  request,
  onOpen,
  onApprove,
  onReject,
  isDeciding,
}: LeaveRequestCardProps) {
  const status = statusKey(request.status);
  const attachments = request.attachments ?? [];

  return (
    <div className={`${card} flex flex-col gap-4 transition-colors hover:border-tl-control`}>
      <button
        type="button"
        onClick={() => onOpen(request._id)}
        className={`-m-2 rounded-2xl p-2 text-left ${focusRing}`}
        aria-label={`Open ${studentName(request)}'s leave request`}
      >
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {/* Plain <img>: avatars come from arbitrary upload hosts and next/image has no remotePatterns configured. */}
            <img
              src={studentAvatar(request)}
              alt=""
              className="h-11 w-11 shrink-0 rounded-full object-cover"
              onError={(event) => {
                event.currentTarget.src = FALLBACK_AVATAR;
              }}
            />
            <h3 className="truncate text-[15px] font-extrabold text-tl-ink">
              {studentName(request)}
            </h3>
          </div>
          <Pill tone={STATUS_TONE[status]} dot className="capitalize">
            {status}
          </Pill>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
          <dt className="font-bold text-tl-muted">Leave Type:</dt>
          <dd className="font-bold text-tl-ink">{leaveTypeLabel(request.leaveType)}</dd>
          <dt className="font-bold text-tl-muted">Date:</dt>
          <dd className="font-bold text-tl-ink">
            {formatDate(request.startDate)} - {formatDate(request.endDate)}
          </dd>
          <dt className="font-bold text-tl-muted">
            <Tooltip
              content="Supporting documents submitted by the parent (e.g. medical certificate)."
              side="right"
            >
              <span>Attachments:</span>
            </Tooltip>
          </dt>
          <dd className="font-bold text-tl-ink">
            {attachments.length === 1 ? "1 file" : `${attachments.length} files`}
          </dd>
        </dl>

        <p className="mt-3.5 line-clamp-3 rounded-2xl border border-tl-line-soft bg-tl-subtle p-3 text-sm text-tl-body">
          {request.reason || "No reason provided."}
        </p>
      </button>

      {status === "pending" && (
        <LeaveDecisionActions
          variant="card"
          isPending={isDeciding}
          onApprove={() => onApprove(request._id)}
          onReject={() => onReject(request._id)}
        />
      )}
    </div>
  );
}
