"use client";

/**
 * Read-only view of one announcement, opened from the list.
 *
 * The list truncates the title and body to one line each; this is where an
 * administrator reads the whole thing and sees who it went to.
 */
import React, { useEffect } from "react";
import { Calendar, Users, X } from "lucide-react";
import { Pill } from "@/components/tl/bits";
import { iconButton } from "@/components/tl/styles";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import {
  AUDIENCE_TONES,
  STATUS_TONES,
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
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-tl-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-tl-line px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-tl-ink">{announcement.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Pill tone={STATUS_TONES[announcement.status] ?? "muted"}>{announcement.status}</Pill>
              <span className="inline-flex items-center gap-2 text-xs font-medium text-tl-muted">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateTime(announcement.publishDate)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={iconButton}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap gap-1.5">
            {announcement.audience.map((audience) => (
              <Pill key={audience} tone={AUDIENCE_TONES[audience] ?? "muted"}>
                <Users className="h-3 w-3" aria-hidden />
                {audience}
              </Pill>
            ))}
          </div>

          <p className="whitespace-pre-line text-sm leading-6 text-tl-body">
            {announcement.content}
          </p>

          <div className="rounded-2xl border border-tl-line bg-tl-subtle px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-tl-faint">
              Read rate
            </p>
            <p className="mt-1 text-lg font-bold text-tl-ink">
              {announcement.readRate}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
