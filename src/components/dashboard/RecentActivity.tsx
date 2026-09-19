"use client";

/**
 * The last few payments and announcements.
 *
 * Each panel is its own component so a viewer who governs fees but not
 * announcements sees one panel at full width instead of an empty half.
 */

import React from "react";
import Link from "next/link";
import { ArrowRight, CreditCard, Megaphone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { RecentAnnouncement, RecentPayment } from "@/app/services/dashboard.service";
import { formatNairaFull, initialsOf } from "./format";
import { PanelEmptyState, PanelSkeleton } from "./primitives";

interface RecentActivityProps {
  payments: RecentPayment[];
  announcements: RecentAnnouncement[];
  isLoading: boolean;
  showPayments: boolean;
  showAnnouncements: boolean;
}

/** Colour of the status pill on a payment row. */
function statusClass(status: RecentPayment["status"]): string {
  if (status === "success")
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400";
  if (status === "pending")
    return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
  return "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400";
}

/** Renders a timestamp the API may have left empty. */
function relativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function RecentActivity({
  payments,
  announcements,
  isLoading,
  showPayments,
  showAnnouncements,
}: RecentActivityProps) {
  if (!showPayments && !showAnnouncements) return null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {showPayments && <PanelSkeleton minH={260} />}
        {showAnnouncements && <PanelSkeleton minH={260} />}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {showPayments && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#003366] dark:text-blue-400" />
              Recent Payments
            </h3>
            <Link
              href="/fees-management"
              className="text-xs text-[#003366] dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {payments.length > 0 ? (
            <div className="space-y-1">
              {payments.map((p, i) => (
                <div
                  key={`${p.studentName}-${p.createdAt}-${i}`}
                  className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-slate-700/50 last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-[#003366]/10 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#003366] dark:text-blue-400">
                      {initialsOf(p.studentName)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">
                      {p.studentName}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                      <CreditCard className="w-2.5 h-2.5" />
                      {p.method}
                      <span>·</span>
                      {relativeTime(p.createdAt)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    <div className="text-xs font-bold text-gray-900 dark:text-slate-100">
                      {formatNairaFull(p.amount)}
                    </div>
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full font-medium",
                        statusClass(p.status)
                      )}
                    >
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PanelEmptyState message="No recent payments to display" />
          )}
        </div>
      )}

      {showAnnouncements && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#003366] dark:text-blue-400" />
              Recent Announcements
            </h3>
            <Link
              href="/announcements"
              className="text-xs text-[#003366] dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {announcements.length > 0 ? (
            <div className="space-y-1">
              {announcements.map((a, i) => (
                <div
                  key={`${a.title}-${a.publishedAt}-${i}`}
                  className="flex items-start gap-3 py-2.5 border-b border-gray-50 dark:border-slate-700/50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate mb-1">
                      {a.title}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#003366]/8 text-[#003366] dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                        {a.audience}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        {relativeTime(a.publishedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-bold text-gray-900 dark:text-slate-100 tabular-nums">
                      {a.readRate}%
                    </div>
                    <div className="text-xs text-gray-400 dark:text-slate-500">read rate</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PanelEmptyState message="No recent announcements" />
          )}
        </div>
      )}
    </div>
  );
}
