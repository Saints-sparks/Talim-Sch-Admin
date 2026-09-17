"use client";

/**
 * One leave request in the review queue.
 *
 * The card opens the full request; the Approve / Reject pair decides it in
 * place without leaving the queue, which is what the pending tab is for.
 */
import React from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import type { LeaveRequest } from "@/app/services/leave.service";
import { LeaveDecisionActions } from "./LeaveDecisionActions";
import {
  FALLBACK_AVATAR,
  STATUS_TEXT,
  formatDate,
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
 * Renders one queue card.
 *
 * @param props - The request, the open handler and the decision handlers.
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
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <button
        type="button"
        onClick={() => onOpen(request._id)}
        className="text-left"
        aria-label={`Open ${studentName(request)}'s leave request`}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center">
            {/* Plain <img>: avatars come from arbitrary upload hosts and next/image has no remotePatterns configured. */}
            <img
              src={studentAvatar(request)}
              alt=""
              className="mr-3 h-11 w-11 shrink-0 rounded-full object-cover"
              onError={(event) => {
                event.currentTarget.src = FALLBACK_AVATAR;
              }}
            />
            <h3 className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">
              {studentName(request)}
            </h3>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-xl border border-slate-200 px-2 py-1 text-[15px] capitalize leading-[120%] dark:border-slate-600",
              STATUS_TEXT[status]
            )}
          >
            {status}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 font-semibold">
            <span className="text-[15px] text-slate-900 dark:text-slate-200">Leave Type:</span>
            <span className="rounded-xl border border-slate-100 px-2 py-1 text-[15px] text-[#4D4D4D] dark:border-slate-600 dark:text-slate-300">
              {request.leaveType}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-semibold">
            <span className="text-[15px] text-slate-900 dark:text-slate-200">Date:</span>
            <span className="rounded-xl border border-slate-100 px-2 py-1 text-[15px] text-[#4D4D4D] dark:border-slate-600 dark:text-slate-300">
              {formatDate(request.startDate)} - {formatDate(request.endDate)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-semibold">
            <Tooltip
              content="Supporting documents submitted by the parent (e.g. medical certificate)."
              side="right"
            >
              <span className="text-[15px] text-slate-900 dark:text-slate-200">Attachments:</span>
            </Tooltip>
            <span className="rounded-xl border border-slate-100 px-2 py-1 text-[15px] text-[#4D4D4D] dark:border-slate-600 dark:text-slate-300">
              {attachments.length === 1 ? "1 file" : `${attachments.length} files`}
            </span>
          </div>

          <p className="line-clamp-3 rounded-xl bg-slate-100 p-3 text-[15px] font-medium text-[#4D4D4D] dark:bg-slate-700/60 dark:text-slate-300">
            {request.reason || "No reason provided."}
          </p>
        </div>
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
