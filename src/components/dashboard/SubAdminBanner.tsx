"use client";

/**
 * Tells a sub-administrator, in their own words, which areas they can reach —
 * so an empty dashboard reads as "you were not granted this" rather than as a
 * broken page.
 */

import React from "react";
import { Permission } from "@/lib/permissions";
import { Banner, pill } from "@/components/tl";

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
  [Permission.MANAGE_SUPPORT]: "Support Desk",
};

/**
 * The tinted notice at the top of a sub-administrator's dashboard: the areas
 * they were granted as pills, or a warning when they have none yet.
 *
 * @param props - The viewer's permissions.
 * @param props.permissions - The permission values they hold.
 * @returns The banner.
 */
export function SubAdminBanner({ permissions }: { permissions: string[] }) {
  if (permissions.length === 0) {
    return (
      <Banner tone="warning">
        Your account has no permissions assigned yet. Contact your school administrator to grant you
        access.
      </Banner>
    );
  }

  return (
    <Banner tone="info" title="Sub-Administrator · Your Access">
      <ul aria-label="Areas you can manage" className="mt-1.5 flex flex-wrap gap-1.5">
        {permissions.map((p) => (
          <li key={p} className={`${pill} bg-tl-surface text-tl-brand`}>
            {LABEL_MAP[p] ?? p}
          </li>
        ))}
      </ul>
    </Banner>
  );
}
