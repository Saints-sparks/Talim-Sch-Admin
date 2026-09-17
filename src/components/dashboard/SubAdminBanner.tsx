"use client";

/**
 * Tells a sub-administrator, in their own words, which areas they can reach —
 * so an empty dashboard reads as "you were not granted this" rather than as a
 * broken page.
 */

import React from "react";
import { ShieldAlert } from "lucide-react";
import { Permission } from "@/lib/permissions";

/** Human labels for the permission values, keyed by the backend's strings. */
const LABEL_MAP: Record<string, string> = {
  [Permission.MANAGE_CLASSES]: "Classes",
  [Permission.MANAGE_CURRICULUM]: "Curriculum",
  [Permission.MANAGE_ASSESSMENTS]: "Assessments",
  [Permission.MANAGE_TIMETABLE]: "Timetable",
  [Permission.MANAGE_FEES]: "Fees",
  [Permission.MANAGE_PAYMENTS]: "Payments",
  [Permission.MANAGE_FINANCE]: "Finance",
  [Permission.MANAGE_STUDENTS]: "Students",
  [Permission.MANAGE_TEACHERS]: "Teachers",
  [Permission.MANAGE_PARENTS]: "Parents",
  [Permission.MANAGE_ANNOUNCEMENTS]: "Announcements",
  [Permission.MANAGE_LEAVE_REQUESTS]: "Leave Requests",
  [Permission.MANAGE_TRANSIT]: "Transit",
  [Permission.MANAGE_MESSAGES]: "Messages",
  [Permission.MANAGE_SETTINGS]: "Settings",
  [Permission.MANAGE_SUB_ADMINS]: "Sub-Administrators",
};

export function SubAdminBanner({ permissions }: { permissions: string[] }) {
  if (permissions.length === 0) {
    return (
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800/40 px-4 py-3 flex items-center gap-3">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Your account has no permissions assigned yet. Contact your school administrator to
          grant you access.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/10 px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="w-4 h-4 text-[#003366] dark:text-blue-400" />
        <p className="text-xs font-semibold text-[#003366] dark:text-blue-400 uppercase tracking-wide">
          Sub-Administrator · Your Access
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {permissions.map((p) => (
          <span
            key={p}
            className="text-xs bg-[#003366]/10 dark:bg-blue-900/30 text-[#003366] dark:text-blue-300 px-2 py-0.5 rounded-full font-medium"
          >
            {LABEL_MAP[p] ?? p}
          </span>
        ))}
      </div>
    </div>
  );
}
