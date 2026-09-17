"use client";

/**
 * The greeting, the current term badge, and the three shortcuts an
 * administrator reaches for first. Each shortcut is hidden unless the viewer
 * holds the permission that governs it.
 */

import React from "react";
import { useRouter } from "next/navigation";
import { HandCoins, Megaphone, RefreshCw, UserRoundPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Permission } from "@/lib/permissions";
import { getGreeting } from "./format";

interface DashboardHeroProps {
  adminName: string;
  schoolName: string;
  /** `"First Term · 2025/2026"`, or null before the term summary lands. */
  termLabel: string | null;
  /** True when the viewer holds the permission (full admins always do). */
  can: (permission: string) => boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function DashboardHero({
  adminName,
  schoolName,
  termLabel,
  can,
  isRefreshing,
  onRefresh,
}: DashboardHeroProps) {
  const router = useRouter();

  return (
    <div className="mb-7">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-[1.6rem] font-extrabold text-gray-900 dark:text-slate-100 leading-tight">
            {getGreeting()},{" "}
            <span className="text-[#003366] dark:text-blue-400">{adminName}</span>!
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Here&apos;s what&apos;s happening at{" "}
            <span className="font-medium text-gray-700 dark:text-slate-300">{schoolName}</span>{" "}
            today.
          </p>
          {termLabel && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold border border-emerald-100 dark:border-emerald-900/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {termLabel}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh dashboard"
            aria-label="Refresh dashboard"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </button>
          {can(Permission.MANAGE_STUDENTS) && (
            <button
              onClick={() => router.push("/users/students")}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              <UserRoundPlus className="w-4 h-4" />
              Add Student
            </button>
          )}
          {(can(Permission.MANAGE_FEES) || can(Permission.MANAGE_PAYMENTS)) && (
            <button
              onClick={() => router.push("/fees-management/create")}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              <HandCoins className="w-4 h-4" />
              Record Payment
            </button>
          )}
          {can(Permission.MANAGE_ANNOUNCEMENTS) && (
            <button
              onClick={() => router.push("/announcements")}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-[#003366] rounded-lg hover:bg-[#002244] transition-colors shadow-sm"
            >
              <Megaphone className="w-4 h-4" />
              New Announcement
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
