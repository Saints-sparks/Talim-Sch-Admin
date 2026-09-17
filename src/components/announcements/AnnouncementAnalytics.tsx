"use client";

/**
 * The analytics rail beside the announcements list: overall read rate, the two
 * engagement cards, and the last week of views.
 */
import React, { useMemo } from "react";
import { BarChart3, Eye } from "lucide-react";
import type { AnnouncementStats } from "@/app/services/announcement.service";
import { clampPercent } from "./announcement.presentation";

/** Seven zeroed days, so the chart has an axis before any data arrives. */
function emptyWeek(): Array<{ date: string; views: number }> {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return { date: date.toISOString(), views: 0 };
  });
}

interface AnnouncementAnalyticsProps {
  stats: AnnouncementStats;
}

/**
 * Renders the announcement analytics rail.
 *
 * @param props.stats - Stats from `useAnnouncementStats`.
 */
export function AnnouncementAnalytics({ stats }: AnnouncementAnalyticsProps) {
  const averageReadRate = Math.round(clampPercent(stats.readRate ?? 0));
  const dailyViews = useMemo(
    () => (stats.dailyViews?.length ? stats.dailyViews : emptyWeek()),
    [stats.dailyViews]
  );
  const maxDailyViews = Math.max(...dailyViews.map((item) => item.views), 1);

  return (
    <aside className="min-w-0 space-y-6" data-guide="announcements-analytics">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Read rate</p>
            <p className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">{averageReadRate}%</p>
          </div>
          <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/30 p-3 text-[#003366] dark:text-blue-400">
            <BarChart3 className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-[#003366] dark:bg-blue-500"
            style={{ width: `${averageReadRate}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        {[
          {
            label: "Parent engagement",
            value: `${stats.parentEngagement ?? 0}%`,
            caption: "Read rate across guardians",
          },
          {
            label: "Student engagement",
            value: `${stats.studentEngagement ?? 0}%`,
            caption: "Average student reads",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{card.value}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{card.caption}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-950 dark:text-white">Daily announcement views</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Views over the last school week</p>
          </div>
          <Eye className="h-5 w-5 text-slate-400 dark:text-slate-500" />
        </div>
        <div className="mt-6 flex h-44 items-end gap-3">
          {dailyViews.map((item) => (
            <div key={item.date} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-xl bg-[#003366] dark:bg-blue-500"
                style={{
                  height: `${Math.max(item.views ? (item.views / maxDailyViews) * 100 : 4, 4)}%`,
                }}
                title={`${item.views} views`}
              />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {new Intl.DateTimeFormat("en-GB", { weekday: "short" })
                  .format(new Date(item.date))
                  .slice(0, 1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
