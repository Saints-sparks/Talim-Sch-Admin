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
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowRight,
  ChevronRight,
  Clock,
  TrendingUp,
  UserMinus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Permission } from "@/lib/permissions";
import type { PendingActionsData } from "@/app/services/dashboard.service";

interface PendingActionsProps {
  pendingActions: PendingActionsData | null;
  isLoading: boolean;
  /** True when the viewer holds the permission (full admins always do). */
  can: (permission: string) => boolean;
}

export function PendingActions({ pendingActions, isLoading, can }: PendingActionsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 animate-pulse"
          >
            <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-xl mb-3" />
            <div className="w-6 h-6 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
            <div className="w-28 h-3.5 bg-gray-100 dark:bg-slate-700 rounded mb-2" />
            <div className="w-20 h-3 bg-gray-100 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!pendingActions) return null;

  const actions = [
    {
      key: "transfers",
      icon: <ArrowLeftRight className="w-5 h-5" />,
      title: "Pending Transfer Requests",
      count: pendingActions.transfers.incoming + pendingActions.transfers.outgoing,
      description: `${pendingActions.transfers.incoming} incoming · ${pendingActions.transfers.outgoing} outgoing`,
      href: "/transit/transfers",
      iconCls: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
      borderCls: "border-red-100 dark:border-red-900/30",
      linkCls: "text-red-600 dark:text-red-400",
      permission: Permission.MANAGE_TRANSIT,
    },
    {
      key: "leave",
      icon: <Clock className="w-5 h-5" />,
      title: "Leave Requests",
      count: pendingActions.leaveRequests.pending,
      description: `${pendingActions.leaveRequests.pending} pending approval`,
      href: "/leave-requests",
      iconCls: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
      borderCls: "border-amber-100 dark:border-amber-900/30",
      linkCls: "text-amber-600 dark:text-amber-400",
      permission: Permission.MANAGE_LEAVE_REQUESTS,
    },
    {
      key: "promotions",
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Open Promotion Runs",
      count: pendingActions.promotionRuns.open,
      description: `${pendingActions.promotionRuns.pendingValidation} pending validation`,
      href: "/transit/promotions",
      iconCls: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
      borderCls: "border-orange-100 dark:border-orange-900/30",
      linkCls: "text-orange-600 dark:text-orange-400",
      permission: Permission.MANAGE_TRANSIT,
    },
    {
      key: "unenrolled",
      icon: <UserMinus className="w-5 h-5" />,
      title: "Students Without Enrollment",
      count: pendingActions.studentsWithoutEnrollment.count,
      description: `${pendingActions.studentsWithoutEnrollment.count} students unassigned`,
      href: "/users/students",
      iconCls: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
      borderCls: "border-slate-200 dark:border-slate-700",
      linkCls: "text-slate-600 dark:text-slate-400",
      permission: Permission.MANAGE_STUDENTS,
    },
  ].filter((a) => a.count > 0 && can(a.permission));

  if (actions.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
          Pending Actions
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link
            key={action.key}
            href={action.href}
            className={cn(
              "group bg-white dark:bg-slate-800 rounded-xl border p-5 hover:shadow-md transition-all duration-200",
              action.borderCls
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn("p-2 rounded-xl", action.iconCls)}>{action.icon}</div>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-gray-500 dark:group-hover:text-slate-400 transition-colors mt-0.5" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1 tabular-nums">
              {action.count}
            </div>
            <div className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 leading-snug">
              {action.title}
            </div>
            <div className="text-xs text-gray-400 dark:text-slate-500 mb-4">
              {action.description}
            </div>
            <div className={cn("text-xs font-semibold flex items-center gap-1", action.linkCls)}>
              Review <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
