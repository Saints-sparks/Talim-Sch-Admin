"use client";

/**
 * Announcements — the school's outgoing broadcasts.
 *
 * The list is filtered and paginated by the API (one cache entry per tab,
 * search term and page), so the counts under the table match what is on
 * screen. Creating an announcement invalidates the cached pages and the stat
 * cards together, and the create button is gated on MANAGE_ANNOUNCEMENTS —
 * a sub-admin without it reads the board but cannot post to it.
 */
import React, { useMemo, useState } from "react";
import { Megaphone, Plus, Search } from "lucide-react";
import { Permission } from "@/lib/permissions";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { getErrorMessage } from "@/lib/apiError";
import AnnouncementsSkeleton from "@/components/AnnouncementsSkeleton";
import { AnnouncementAnalytics } from "@/components/announcements/AnnouncementAnalytics";
import { AnnouncementDetailModal } from "@/components/announcements/AnnouncementDetailModal";
import { AnnouncementStatsCards } from "@/components/announcements/AnnouncementStatsCards";
import { AnnouncementTable } from "@/components/announcements/AnnouncementTable";
import { CreateAnnouncementModal } from "@/components/announcements/CreateAnnouncementModal";
import {
  TAB_STATUS,
  toDashboardAnnouncement,
  type AnnouncementTab,
  type DashboardAnnouncement,
} from "@/components/announcements/announcement.presentation";
import {
  emptyAnnouncementStats,
  useAnnouncementStats,
  useAnnouncements,
  useDebouncedValue,
} from "@/hooks/announcements/useAnnouncements";

/** Rows per page — the API's own default. */
const PAGE_SIZE = 10;

/**
 * The announcements dashboard.
 */
export default function AnnouncementsPage() {
  const [activeTab, setActiveTab] = useState<AnnouncementTab>("Published");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<DashboardAnnouncement | null>(null);

  const search = useDebouncedValue(searchTerm.trim());

  const list = useAnnouncements({
    page,
    limit: PAGE_SIZE,
    status: TAB_STATUS[activeTab],
    search: search || undefined,
  });
  const statsQuery = useAnnouncementStats();

  const announcements = useMemo<DashboardAnnouncement[]>(
    () => (list.data?.data ?? []).map(toDashboardAnnouncement),
    [list.data]
  );

  const stats = statsQuery.data ?? emptyAnnouncementStats;
  const meta = list.data?.meta;

  const changeTab = (tab: AnnouncementTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const changeSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  // Nothing has ever loaded: the whole board is a skeleton rather than a set of
  // empty frames. Later loads keep the frames and only the rows shimmer.
  if (list.isLoading && !list.data && !list.isError) {
    return <AnnouncementsSkeleton />;
  }

  return (
    <>
      <div className="min-h-full max-w-full overflow-x-hidden bg-white dark:bg-slate-900">
        <section
          className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-6 sm:px-6 lg:px-8"
          data-guide="announcements-header"
        >
          <div className="mx-auto w-full max-w-[1480px]">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-semibold text-[#003366] dark:text-blue-400">
                  <Megaphone className="h-3.5 w-3.5" />
                  School-wide communications
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                  Announcements
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                  Create, schedule, analyze, and manage every school announcement from one calm
                  command center.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => changeSearch(event.target.value)}
                    placeholder="Search announcements..."
                    aria-label="Search announcements"
                    className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition focus:border-[#003366] dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 sm:w-72"
                  />
                </div>
                <PermissionGate permission={Permission.MANAGE_ANNOUNCEMENTS}>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    data-guide="announcements-create"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#003366] px-5 text-sm font-semibold text-white shadow-lg shadow-blue-950/15 hover:bg-[#002952]"
                  >
                    <Plus className="h-4 w-4" />
                    New Announcement
                  </button>
                </PermissionGate>
              </div>
            </div>

            <AnnouncementStatsCards stats={stats} />
          </div>
        </section>

        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-6">
              <AnnouncementTable
                announcements={announcements}
                activeTab={activeTab}
                onTabChange={changeTab}
                isLoading={list.isFetching && !list.data}
                errorMessage={
                  list.isError ? getErrorMessage(list.error, "Failed to fetch announcements.") : null
                }
                onRetry={() => void list.refetch()}
                onView={setViewing}
                page={meta?.page ?? page}
                lastPage={Math.max(meta?.lastPage ?? 1, 1)}
                limit={meta?.limit ?? PAGE_SIZE}
                total={meta?.total ?? 0}
                onPageChange={setPage}
              />
            </div>

            <AnnouncementAnalytics stats={stats} />
          </div>
        </main>
      </div>

      <PermissionGate permission={Permission.MANAGE_ANNOUNCEMENTS}>
        <CreateAnnouncementModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      </PermissionGate>

      <AnnouncementDetailModal announcement={viewing} onClose={() => setViewing(null)} />
    </>
  );
}
