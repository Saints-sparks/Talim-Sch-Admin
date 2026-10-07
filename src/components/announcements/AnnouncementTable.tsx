"use client";

/**
 * The announcements list: status filter, the table itself, and server-side
 * pagination.
 *
 * Every state the list can be in is rendered here — loading, failed, empty and
 * populated — so the page never shows a spinner that a failed request left
 * behind. Rows are a fixed height and the table keeps its own horizontal
 * scroll container, so the list does not jump when a new page lands and the
 * page itself never scrolls sideways.
 */
import React from "react";
import { cn } from "@/lib/utils";
import { Bell, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Eye, FileText, Paperclip, Pin, Users } from "lucide-react";
import {
  EmptyNote,
  Pill,
  Segmented,
  cardFrame,
  focusRing,
  ghostButton,
  skeletonBlock,
  table,
  tableScroll,
  td,
  th,
  theadRow,
  tr,
} from "@/components/tl";
import {
  ANNOUNCEMENT_TABS,
  AUDIENCE_TONES,
  STATUS_TONES,
  clampPercent,
  formatDateTime,
  type AnnouncementTab,
  type DashboardAnnouncement,
} from "./announcement.presentation";

/** The status filter's options. */
const TAB_OPTIONS = ANNOUNCEMENT_TABS.map((tab) => ({ value: tab, label: tab }));

/** The 44px square page buttons. */
const pageButton = `flex h-11 w-11 items-center justify-center rounded-[11px] border border-tl-control bg-tl-surface text-tl-brand transition-colors hover:bg-tl-bg disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

/** Props for {@link AnnouncementTable}. */
interface AnnouncementTableProps {
  /** The rows of this page. */
  announcements: DashboardAnnouncement[];
  /** The status shown. */
  activeTab: AnnouncementTab;
  /** Picks a status. */
  onTabChange: (tab: AnnouncementTab) => void;
  /** True while the first page of a filter is loading. */
  isLoading: boolean;
  /** Message to show instead of rows when the request failed. */
  errorMessage: string | null;
  /** Loads the page again. */
  onRetry: () => void;
  /** Opens one announcement. */
  onView: (announcement: DashboardAnnouncement) => void;
  /** The page shown, from 1. */
  page: number;
  /** The last page. */
  lastPage: number;
  /** Rows per page. */
  limit: number;
  /** All rows of this filter. */
  total: number;
  /** Goes to a page. */
  onPageChange: (page: number) => void;
}

/**
 * Renders the announcements card: the status filter, the table and the
 * pagination.
 *
 * @param props - List data, the active tab and the pagination handlers.
 * @param props.announcements - The rows.
 * @param props.activeTab - The status shown.
 * @param props.onTabChange - Status handler.
 * @param props.isLoading - Whether the rows load.
 * @param props.errorMessage - The failure, if any.
 * @param props.onRetry - Retry handler.
 * @param props.onView - Opens a row.
 * @param props.page - The page.
 * @param props.lastPage - The last page.
 * @param props.limit - Rows per page.
 * @param props.total - All rows.
 * @param props.onPageChange - Page handler.
 * @returns The card.
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
    <div className={`${cardFrame} min-w-0`} data-guide="announcements-list">
      <div className="flex flex-col gap-3 border-b border-tl-line-soft px-[18px] py-4 lg:flex-row lg:items-center lg:justify-between">
        <Segmented options={TAB_OPTIONS} value={activeTab} onChange={onTabChange} label="Show announcements" />
        <div className="flex items-center gap-2 text-sm font-semibold text-tl-muted">
          <CheckCircle2 className="h-4 w-4 text-tl-success" aria-hidden />
          {announcements.length} records visible
        </div>
      </div>

      <div className={tableScroll}>
        <table className={`${table} min-w-[720px] table-fixed`}>
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[18%]" />
            <col className="w-[13%]" />
            <col className="w-[16%]" />
            <col className="w-[15%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead>
            <tr className={theadRow}>
              <th className={th}>Announcement</th>
              <th className={th}>Audience</th>
              <th className={th}>Status</th>
              <th className={th}>Publish Date</th>
              <th className={th}>Read Rate</th>
              <th className={cn(th, "text-right")}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <AnnouncementRowsSkeleton />
            ) : errorMessage ? (
              <tr className="border-t border-tl-line-soft">
                <td colSpan={6} className="px-5 py-12 text-center">
                  <p className="text-sm font-bold text-tl-danger" role="alert">
                    {errorMessage}
                  </p>
                  <button type="button" onClick={onRetry} className={`${ghostButton} mt-4`}>
                    Try again
                  </button>
                </td>
              </tr>
            ) : announcements.length ? (
              announcements.map((announcement) => (
                <AnnouncementRow key={announcement.id} announcement={announcement} onView={onView} />
              ))
            ) : (
              <tr className="border-t border-tl-line-soft">
                <td colSpan={6}>
                  <EmptyNote compact icon={<Bell />} title="No announcements found for this view." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-tl-line-soft px-[18px] py-3.5 text-sm text-tl-muted sm:flex-row sm:items-center sm:justify-between">
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
              className={pageButton}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <span
              className="flex h-11 min-w-11 items-center justify-center rounded-[11px] bg-tl-select px-3 text-sm font-extrabold text-tl-brand"
              aria-current="page"
            >
              {page}
            </span>
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => onPageChange(page + 1)}
              className={pageButton}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Placeholder rows, so the table keeps its height while a page loads.
 *
 * @returns Five pulsing rows.
 */
function AnnouncementRowsSkeleton() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((row) => (
        <tr key={row} className="border-t border-tl-line-soft" aria-hidden>
          {[0, 1, 2, 3, 4, 5].map((cell) => (
            <td key={cell} className="px-4 py-5">
              <div className={`${skeletonBlock} h-4 rounded`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * One announcement row: icon, title and first line, audience and status
 * pills, the date, the read-rate bar and View.
 *
 * @param props - The row and its handler.
 * @param props.announcement - The announcement.
 * @param props.onView - Opens it.
 * @returns The row.
 */
function AnnouncementRow({
  announcement,
  onView,
}: {
  announcement: DashboardAnnouncement;
  onView: (announcement: DashboardAnnouncement) => void;
}) {
  return (
    <tr className={tr}>
      <td className={td}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-tl-select text-tl-brand">
            {announcement.pinned ? (
              <Pin className="h-5 w-5" aria-hidden />
            ) : announcement.hasAttachment ? (
              <FileText className="h-5 w-5" aria-hidden />
            ) : (
              <Bell className="h-5 w-5" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-bold text-tl-ink">{announcement.title}</p>
              {announcement.pinned && <Pill tone="info">Pinned</Pill>}
              {announcement.hasAttachment && (
                <Paperclip className="h-4 w-4 shrink-0 text-tl-faint" aria-label="Has an attachment" />
              )}
            </div>
            <p className="mt-1 truncate text-sm text-tl-muted">{announcement.content}</p>
          </div>
        </div>
      </td>
      <td className={td}>
        <div className="flex flex-wrap gap-1.5">
          {announcement.audience.map((audience) => (
            <Pill key={audience} tone={AUDIENCE_TONES[audience] ?? "muted"} className="max-w-full">
              <Users className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{audience}</span>
            </Pill>
          ))}
        </div>
      </td>
      <td className={td}>
        <Pill tone={STATUS_TONES[announcement.status]} dot>
          {announcement.status}
        </Pill>
      </td>
      <td className={cn(td, "font-semibold text-tl-muted")}>
        <span className="inline-flex min-w-0 items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-tl-faint" aria-hidden />
          {formatDateTime(announcement.publishDate)}
        </span>
      </td>
      <td className={td}>
        <div className="flex items-center gap-2">
          <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-tl-track" aria-hidden>
            <div
              className="h-full rounded-full bg-tl-brand-fill"
              style={{ width: `${clampPercent(announcement.readRate)}%` }}
            />
          </div>
          <span className="shrink-0 text-sm font-bold text-tl-ink">{announcement.readRate}%</span>
        </div>
      </td>
      <td className={td}>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onView(announcement)}
            aria-label={`View ${announcement.title}`}
            className={pageButton}
          >
            <Eye className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </td>
    </tr>
  );
}
