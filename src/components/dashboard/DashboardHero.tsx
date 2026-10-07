"use client";

/**
 * The greeting, the current term, and the three shortcuts an administrator
 * reaches for first. Each shortcut is hidden unless the viewer holds the
 * permission that governs it.
 */

import React from "react";
import { useRouter } from "next/navigation";
import { HandCoins, Megaphone, RefreshCw, UserRoundPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Permission } from "@/lib/permissions";
import { PageHeader, Pill, ghostButton, iconButton, primaryButton } from "@/components/tl";
import { getGreeting } from "./format";

/** Props for {@link DashboardHero}. */
interface DashboardHeroProps {
  /** The signed-in administrator's first name. */
  adminName: string;
  /** The school's name, for the line under the greeting. */
  schoolName: string;
  /** `"First Term · 2025/2026"`, or null before the term summary lands. */
  termLabel: string | null;
  /** True when the viewer holds the permission (full admins always do). */
  can: (permission: string) => boolean;
  /** True while a refresh is in flight. */
  isRefreshing: boolean;
  /** Refetches every panel. */
  onRefresh: () => void;
}

/**
 * The dashboard's heading: "Good morning, Sade!", the school and term line,
 * the refresh button and the permitted shortcuts.
 *
 * @param props - See {@link DashboardHeroProps}.
 * @param props.adminName - First name in the greeting.
 * @param props.schoolName - School in the line under it.
 * @param props.termLabel - Current term, when known.
 * @param props.can - Permission check.
 * @param props.isRefreshing - Whether a refresh is running.
 * @param props.onRefresh - Refresh handler.
 * @returns The page header.
 */
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
    <PageHeader
      title={
        <>
          {getGreeting()}, <span className="text-tl-brand">{adminName}</span>!
        </>
      }
      subtitle={
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <span>
            Here&apos;s what&apos;s happening at{" "}
            <span className="font-bold text-tl-body">{schoolName}</span> today.
          </span>
          {termLabel ? (
            <Pill tone="success" dot>
              {termLabel}
            </Pill>
          ) : null}
        </span>
      }
      actions={
        <>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh dashboard"
            aria-label="Refresh dashboard"
            className={`${iconButton} border border-tl-control bg-tl-surface`}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} aria-hidden />
          </button>
          {can(Permission.MANAGE_STUDENTS) && (
            <button
              type="button"
              onClick={() => router.push("/users/students")}
              className={ghostButton}
            >
              <UserRoundPlus className="h-4 w-4" aria-hidden />
              Add Student
            </button>
          )}
          {(can(Permission.MANAGE_FEES) || can(Permission.MANAGE_PAYMENTS)) && (
            <button
              type="button"
              onClick={() => router.push("/fees-management/create")}
              className={ghostButton}
            >
              <HandCoins className="h-4 w-4" aria-hidden />
              Record Payment
            </button>
          )}
          {can(Permission.MANAGE_ANNOUNCEMENTS) && (
            <button
              type="button"
              onClick={() => router.push("/announcements")}
              className={primaryButton}
            >
              <Megaphone className="h-4 w-4" aria-hidden />
              New Announcement
            </button>
          )}
        </>
      }
    />
  );
}
