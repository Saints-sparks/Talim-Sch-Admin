"use client";

/**
 * The four counters above the announcements list: totals per status, each with
 * the change on the previous week.
 */
import React from "react";
import { Archive, Clock3, Megaphone, Send } from "lucide-react";
import type { AnnouncementStats } from "@/app/services/announcement.service";
import { cn } from "@/lib/utils";

const CARDS = [
  {
    label: "Total announcements",
    icon: Megaphone,
    tone: "bg-blue-50 text-[#003366] dark:bg-blue-900/30 dark:text-blue-400",
    value: (stats: AnnouncementStats) => stats.totalAnnouncements,
    change: (stats: AnnouncementStats) => stats.weeklyChange?.totalAnnouncements ?? 0,
  },
  {
    label: "Published",
    icon: Send,
    tone: "bg-blue-50 text-[#003366] dark:bg-blue-900/30 dark:text-blue-400",
    value: (stats: AnnouncementStats) => stats.published,
    change: (stats: AnnouncementStats) => stats.weeklyChange?.published ?? 0,
  },
  {
    label: "Scheduled",
    icon: Clock3,
    tone: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    value: (stats: AnnouncementStats) => stats.scheduled,
    change: (stats: AnnouncementStats) => stats.weeklyChange?.scheduled ?? 0,
  },
  {
    label: "Drafts",
    icon: Archive,
    tone: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    value: (stats: AnnouncementStats) => stats.drafts,
    change: (stats: AnnouncementStats) => stats.weeklyChange?.drafts ?? 0,
  },
] as const;

/** Formats a weekly delta, e.g. `+12% this week`. */
function formatWeeklyChange(value: number): string {
  return `${value > 0 ? "+" : ""}${value}% this week`;
}

interface AnnouncementStatsCardsProps {
  stats: AnnouncementStats;
}

/**
 * Renders the announcement counters.
 *
 * @param props.stats - Stats from `useAnnouncementStats`, zeroed while loading.
 */
export function AnnouncementStatsCards({ stats }: AnnouncementStatsCardsProps) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-guide="announcements-stats">
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={cn("rounded-2xl p-3", card.tone)}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {formatWeeklyChange(card.change(stats))}
              </span>
            </div>
            <p className="mt-5 text-3xl font-bold text-slate-950 dark:text-white">{card.value(stats)}</p>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
}
