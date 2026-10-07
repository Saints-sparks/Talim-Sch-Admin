"use client";

/**
 * The inbox column: one row per notification, with the unread ones weighted.
 *
 * The column scrolls inside itself rather than growing the page, so the detail
 * panel beside it stays put while the list is scrolled.
 */
import React from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { AdminNotification } from "@/app/services/notification.service";
import { CATEGORY_BADGES } from "./notification.presentation";

interface NotificationListProps {
  notifications: AdminNotification[];
  selectedId: string | null;
  onSelect: (notification: AdminNotification) => void;
}

/**
 * Renders the notification column.
 *
 * @param props - The filtered notifications and the selection handlers.
 */
export function NotificationList({ notifications, selectedId, onSelect }: NotificationListProps) {
  return (
    <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-tl-line bg-tl-surface lg:w-[380px] xl:w-[420px]">
      <div className="border-b border-tl-line-soft px-4 py-3 text-xs font-semibold uppercase tracking-wide text-tl-muted">
        {notifications.length} notification{notifications.length === 1 ? "" : "s"}
      </div>
      <div className="flex-1 overflow-y-auto">
        {notifications.map((notification) => {
          const badge = CATEGORY_BADGES[notification.category];
          const isSelected = selectedId === notification.id;
          const unread = !notification.isRead;

          return (
            <button
              key={notification.id}
              type="button"
              onClick={() => onSelect(notification)}
              aria-current={isSelected}
              className={cn(
                "flex w-full gap-3 border-b border-tl-line-soft px-4 py-3.5 text-left transition hover:bg-tl-bg",
                " ",
                isSelected && "border-l-2 border-l-tl-brand bg-tl-select",
                unread && !isSelected && "bg-tl-subtle"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  badge.bg,
                  badge.text
                )}
              >
                {badge.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "truncate text-sm leading-snug",
                      unread ? "font-semibold text-tl-ink" : "font-medium text-tl-body"
                    )}
                  >
                    {notification.title}
                  </span>
                  {unread && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-tl-brand-fill" />
                  )}
                </span>
                <span className="mt-0.5 line-clamp-1 block text-xs text-tl-muted">
                  {notification.message}
                </span>
                <span className="mt-1 block text-[11px] text-tl-muted">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
