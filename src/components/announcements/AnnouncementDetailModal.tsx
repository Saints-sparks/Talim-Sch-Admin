"use client";

/**
 * Read-only view of one announcement, opened from the list.
 *
 * The list truncates the title and body to one line each; this is where an
 * administrator reads the whole thing and sees who it went to.
 */
import React, { useEffect } from "react";
import { Calendar, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import {
  AUDIENCE_STYLES,
  STATUS_STYLES,
  formatDateTime,
  type DashboardAnnouncement,
} from "./announcement.presentation";

interface AnnouncementDetailModalProps {
  announcement: DashboardAnnouncement | null;
  onClose: () => void;
}

/**
 * Renders the announcement detail dialog.
 *
 * @param props.announcement - The announcement to show, or null when closed.
 * @param props.onClose - Closes the dialog.
 */
export function AnnouncementDetailModal({ announcement, onClose }: AnnouncementDetailModalProps) {
  useBodyScrollLock(Boolean(announcement));

  useEffect(() => {
    if (!announcement) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [announcement, onClose]);

  if (!announcement) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={announcement.title}
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-700 px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">{announcement.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
                  STATUS_STYLES[announcement.status]
                )}
              >
                {announcement.status}
              </span>
              <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateTime(announcement.publishDate)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap gap-1.5">
            {announcement.audience.map((audience) => (
              <span
                key={audience}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold",
                  AUDIENCE_STYLES[audience] ?? AUDIENCE_STYLES["All Teachers"]
                )}
              >
                <Users className="h-3 w-3" />
                {audience}
              </span>
            ))}
          </div>

          <p className="whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-300">
            {announcement.content}
          </p>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Read rate
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
              {announcement.readRate}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
