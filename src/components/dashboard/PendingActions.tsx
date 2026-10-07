"use client";

/**
 * The queues waiting on an administrator: transfers, leave, promotion runs and
 * students with no enrolment.
 *
 * A tile appears only when its count is above zero and the viewer holds the
 * permission that governs it — the section disappears entirely when there is
 * nothing for this administrator to act on.
 */

import React from "react";
import Link from "next/link";
import { ArrowLeftRight, Clock, TrendingUp, UserMinus } from "lucide-react";
import { Permission } from "@/lib/permissions";
import type { PendingActionsData } from "@/app/services/dashboard.service";
import { CardHeader, card, rowButton, skeletonBlock } from "@/components/tl";
import { PanelLoading } from "./primitives";

/** Props for {@link PendingActions}. */
interface PendingActionsProps {
  /** The queue counts, or null when they failed or are empty. */
  pendingActions: PendingActionsData | null;
  /** True while they load. */
  isLoading: boolean;
  /** True when the viewer holds the permission (full admins always do). */
  can: (permission: string) => boolean;
}

/**
 * "Pending Actions", the dashboard's "needs your attention" card: one row per
 * queue with work in it (transfers, leave, promotion runs, students with no
 * class), each with its count, a line of detail and a Review button. Hidden
 * when nothing is waiting on this administrator.
 *
 * @param props - See {@link PendingActionsProps}.
 * @param props.pendingActions - The counts.
 * @param props.isLoading - Whether they are loading.
 * @param props.can - Permission check.
 * @returns The card, its skeleton, or null.
 */
export function PendingActions({ pendingActions, isLoading, can }: PendingActionsProps) {
  if (isLoading) {
    return (
      <PanelLoading label="Loading pending actions" className={`${card} flex flex-col gap-4`}>
        <div aria-hidden className={`${skeletonBlock} h-5 w-40 rounded`} />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} aria-hidden className="flex items-center gap-3.5">
            <div className={`${skeletonBlock} h-10 w-10 rounded-xl`} />
            <div className="flex flex-1 flex-col gap-2">
              <div className={`${skeletonBlock} h-4 w-48 max-w-full rounded`} />
              <div className={`${skeletonBlock} h-3 w-32 max-w-full rounded`} />
            </div>
          </div>
        ))}
      </PanelLoading>
    );
  }

  if (!pendingActions) return null;

  const actions = [
    {
      key: "transfers",
      icon: <ArrowLeftRight />,
      title: "Pending Transfer Requests",
      count: pendingActions.transfers.incoming + pendingActions.transfers.outgoing,
      description: `${pendingActions.transfers.incoming} incoming · ${pendingActions.transfers.outgoing} outgoing`,
      href: "/transit/transfers",
      tone: "bg-tl-danger-bg text-tl-danger",
      permission: Permission.MANAGE_TRANSIT,
    },
    {
      key: "leave",
      icon: <Clock />,
      title: "Leave Requests",
      count: pendingActions.leaveRequests.pending,
      description: `${pendingActions.leaveRequests.pending} pending approval`,
      href: "/leave-requests",
      tone: "bg-tl-warning-bg text-tl-warning",
      permission: Permission.MANAGE_LEAVE_REQUESTS,
    },
    {
      key: "promotions",
      icon: <TrendingUp />,
      title: "Open Promotion Runs",
      count: pendingActions.promotionRuns.open,
      description: `${pendingActions.promotionRuns.pendingValidation} pending validation`,
      href: "/transit/promotions",
      tone: "bg-tl-accent-bg text-tl-accent",
      permission: Permission.MANAGE_TRANSIT,
    },
    {
      key: "unenrolled",
      icon: <UserMinus />,
      title: "Students Without Enrollment",
      count: pendingActions.studentsWithoutEnrollment.count,
      description: `${pendingActions.studentsWithoutEnrollment.count} students unassigned`,
      href: "/users/students",
      tone: "bg-tl-track text-tl-muted",
      permission: Permission.MANAGE_STUDENTS,
    },
  ].filter((a) => a.count > 0 && can(a.permission));

  if (actions.length === 0) return null;

  return (
    <section aria-labelledby="dash-pending-title" className={card}>
      <CardHeader
        title={<span id="dash-pending-title">Pending Actions</span>}
        actions={
          <span className="text-[13px] font-bold text-tl-faint">
            {actions.length} {actions.length === 1 ? "queue" : "queues"} open
          </span>
        }
      />
      <ul className="mt-2">
        {actions.map((action) => (
          <li
            key={action.key}
            className="flex flex-wrap items-center gap-3.5 border-t border-tl-line-soft py-3.5"
          >
            <span
              aria-hidden
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5 ${action.tone}`}
            >
              {action.icon}
            </span>
            <div className="min-w-[180px] flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[15px] font-bold text-tl-ink">{action.title}</span>
                <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-tl-track px-1.5 text-xs font-extrabold text-tl-ink tabular-nums">
                  {action.count}
                </span>
              </div>
              <div className="mt-[3px] text-[13px] text-tl-muted">{action.description}</div>
            </div>
            <Link href={action.href} className={rowButton} aria-label={`Review ${action.title}`}>
              Review
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
