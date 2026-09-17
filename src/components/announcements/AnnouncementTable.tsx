"use client";

/**
 * The announcements list: status tabs, the table itself, and server-side
 * pagination.
 *
 * Every state the list can be in is rendered here — loading, failed, empty and
 * populated — so the page never shows a spinner that a failed request left
 * behind. Rows are a fixed height and the table keeps its own horizontal
 * scroll container, so the list does not jump when a new page lands.
 */
import React from "react";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Paperclip,
  Pin,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ANNOUNCEMENT_TABS,
  AUDIENCE_STYLES,
  STATUS_STYLES,
  clampPercent,
  formatDateTime,
  type AnnouncementTab,
  type DashboardAnnouncement,
} from "./announcement.presentation";

interface AnnouncementTableProps {
  announcements: DashboardAnnouncement[];
  activeTab: AnnouncementTab;
  onTabChange: (tab: AnnouncementTab) => void;
  /** True while the first page of a filter is loading. */
  isLoading: boolean;
  /** Message to show instead of rows when the request failed. */
  errorMessage: string | null;
  onRetry: () => void;
  onView: (announcement: DashboardAnnouncement) => void;
  page: number;
  lastPage: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

/**
 * Renders the tabbed announcements table.
 *
 * @param props - List data, the active tab and the pagination handlers.
 */
export function AnnouncementTable({
  announcements,
  activeTab,
  onTabChange,
  isLoading,
  errorMessage,
  onRetry,
  onView,
  page,
  lastPage,
  limit,
  total,
  onPageChange,
}: AnnouncementTableProps) {
  const showPagination = lastPage > 1;
  const firstOnPage = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastOnPage = Math.min(page * limit, total);

  return (
    <div
      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
      data-guide="announcements-list"
    >
      <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-700 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {ANNOUNCEMENT_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={cn(
                "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition",
                activeTab === tab
                  ? "bg-[#003366] text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <CheckCircle2 className="h-4 w-4 text-[#003366] dark:text-blue-400" />
          {announcements.length} records visible
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] table-fixed text-left">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[18%]" />
            <col className="w-[13%]" />
            <col className="w-[16%]" />
            <col className="w-[15%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-4 py-4">Announcement</th>
              <th className="px-4 py-4">Audience</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Publish Date</th>
              <th className="px-4 py-4">Read Rate</th>
              <th className="px-4 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {isLoading ? (
              <AnnouncementRowsSkeleton />
            ) : errorMessage ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 rounded-xl bg-[#003366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#002952]"
                  >
                    Try again
                  </button>
                </td>
              </tr>
            ) : announcements.length ? (
              announcements.map((announcement) => (
                <AnnouncementRow key={announcement.id} announcement={announcement} onView={onView} />
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  No announcements found for this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 dark:border-slate-700 px-5 py-4 text-sm text-slate-600 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {showPagination
            ? `Showing ${firstOnPage} to ${lastOnPage} of ${total} announcements`
            : `Showing ${announcements.length} of ${total} announcements`}
        </p>
        {showPagination && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-[#003366] dark:border-blue-500 px-3 text-sm font-bold text-[#003366] dark:text-blue-400">
              {page}
            </span>
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => onPageChange(page + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Placeholder rows, so the table keeps its height while a page loads. */
function AnnouncementRowsSkeleton() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((row) => (
        <tr key={row} className="animate-pulse">
          {[0, 1, 2, 3, 4, 5].map((cell) => (
            <td key={cell} className="px-4 py-5">
              <div className="h-4 rounded bg-slate-100 dark:bg-slate-700" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** One announcement row. */
function AnnouncementRow({
  announcement,
  onView,
}: {
  announcement: DashboardAnnouncement;
  onView: (announcement: DashboardAnnouncement) => void;
}) {
  return (
    <tr className="group transition hover:bg-slate-50/80 dark:hover:bg-slate-700/30">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-[#003366] dark:text-blue-400">
            {announcement.pinned ? (
              <Pin className="h-5 w-5" />
            ) : announcement.hasAttachment ? (
              <FileText className="h-5 w-5" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-slate-950 dark:text-white">{announcement.title}</p>
              {announcement.pinned && (
                <span className="rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-[11px] font-bold text-[#003366] dark:text-blue-400">
                  Pinned
                </span>
              )}
              {announcement.hasAttachment && (
                <Paperclip className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
              )}
            </div>
            <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{announcement.content}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-1.5">
          {announcement.audience.map((audience) => (
            <span
              key={audience}
              className={cn(
                "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold",
                AUDIENCE_STYLES[audience] ?? AUDIENCE_STYLES["All Teachers"]
              )}
            >
              <Users className="h-3 w-3 shrink-0" />
              <span className="truncate">{audience}</span>
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-4">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
            STATUS_STYLES[announcement.status]
          )}
        >
          {announcement.status}
        </span>
      </td>
      <td className="px-4 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
        <span className="inline-flex min-w-0 items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
          {formatDateTime(announcement.publishDate)}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-[#003366] dark:bg-blue-500"
              style={{ width: `${clampPercent(announcement.readRate)}%` }}
            />
          </div>
          <span className="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {announcement.readRate}%
          </span>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onView(announcement)}
            aria-label={`View ${announcement.title}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 shadow-sm hover:border-blue-100 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-[#003366] dark:hover:text-blue-400"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
