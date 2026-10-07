"use client";

/**
 * Notifications — the administrator's own inbox.
 *
 * Notifications are per-user, so the cache is keyed by user id, not school.
 * Read state is the server's (`isRead` per recipient), which is what the
 * header bell counts, so opening one here updates the bell instead of only
 * this tab. The socket's notification event invalidates the inbox; nothing
 * polls.
 */
import React, { useMemo, useState } from "react";
import { Bell, CheckCheck, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/CustomToast";
import { NotificationDetail } from "@/components/notifications/NotificationDetail";
import { NotificationList } from "@/components/notifications/NotificationList";
import { ReceiptModal } from "@/components/notifications/ReceiptModal";
import {
  NOTIFICATION_TABS,
  filterNotifications,
  type NotificationTab,
} from "@/components/notifications/notification.presentation";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/notifications/useNotifications";
import { useReceiptSettings } from "@/hooks/fees/queries";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { iconButton, segment, segmentTrack } from "@/components/tl/styles";

/**
 * The notifications inbox.
 */
export default function NotificationsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<NotificationTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const inbox = useNotifications();
  const receiptSettings = useReceiptSettings();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = useMemo(() => inbox.data ?? [], [inbox.data]);
  const filtered = useMemo(() => filterNotifications(notifications, tab), [notifications, tab]);
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  // The panel shows the selected notification while it is still in the active
  // tab, and otherwise the first one — so switching tabs never leaves the
  // panel showing something the list no longer contains.
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  /**
   * Opening a notification marks it read. Only an explicit click does this:
   * auto-marking whatever the panel falls back to would walk the unread tab
   * and clear the whole inbox one render at a time.
   */
  const handleSelect = (notificationId: string, isRead: boolean) => {
    setSelectedId(notificationId);
    if (isRead) return;
    markRead.mutate(notificationId, {
      onError: (error) => logger.error("notifications", "Failed to mark notification read", error),
    });
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast.success("All notifications marked as read");
    } catch (error) {
      logger.error("notifications", "Failed to mark all notifications read", error);
      toast.error(getErrorMessage(error, "Couldn't mark everything as read."));
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1460px] flex-col gap-[18px] px-[clamp(14px,3vw,26px)] pb-16 pt-[clamp(18px,3vw,28px)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="m-0 text-[clamp(24px,3.4vw,32px)] font-extrabold tracking-[-0.6px] text-tl-ink">
            Notifications
          </h1>
          <span className="rounded-full border border-tl-line bg-tl-surface px-3 py-1 text-[15px] font-medium text-tl-ink">
            {notifications.length}
          </span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-tl-danger-bg px-2.5 py-1 text-xs font-extrabold text-tl-danger">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void inbox.refetch()}
            disabled={inbox.isFetching}
            title="Refresh"
            aria-label="Refresh notifications"
            className={`${iconButton} border border-tl-line`}
          >
            <RefreshCw className={cn("h-4 w-4", inbox.isFetching && "animate-spin")} />
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              disabled={markAllRead.isPending}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[14px] bg-tl-brand-fill px-[18px] py-2.5 text-sm font-bold text-tl-on-brand transition hover:bg-tl-brand-fill-hover disabled:opacity-40"
            >
              <CheckCheck className="h-4 w-4" />
              {markAllRead.isPending ? "Marking..." : "Mark all read"}
            </button>
          )}
        </div>
      </div>

      <div role="group" aria-label="Show notifications" className={`${segmentTrack} w-fit`}>
        {NOTIFICATION_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={segment(tab === key)}
          >
            {label}
            {key === "unread" && unreadCount > 0 && (
              <span className="rounded-full bg-tl-badge px-1.5 py-0.5 text-[11px] font-extrabold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {inbox.isLoading ? (
        <div className="flex min-h-[300px] flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-tl-brand" />
        </div>
      ) : inbox.isError ? (
        <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="font-semibold text-tl-danger">
            {getErrorMessage(inbox.error, "Failed to load notifications")}
          </p>
          <button
            type="button"
            onClick={() => void inbox.refetch()}
            className="inline-flex min-h-[44px] items-center rounded-[14px] bg-tl-brand-fill px-[18px] py-2.5 text-sm font-bold text-tl-on-brand transition hover:bg-tl-brand-fill-hover"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-tl-line bg-tl-surface text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-tl-track">
            <Bell className="h-8 w-8 text-tl-faint" />
          </div>
          <p className="font-semibold text-tl-ink">
            {tab === "unread" ? "You're all caught up!" : "No notifications"}
          </p>
          <p className="max-w-xs text-sm text-tl-muted">
            {tab === "unread"
              ? "No unread notifications right now."
              : "Alerts from Talim and system events will appear here."}
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 gap-4">
          <NotificationList
            notifications={filtered}
            selectedId={selected?.id ?? null}
            onSelect={(notification) => handleSelect(notification.id, notification.isRead)}
          />

          <div className="hidden min-w-0 flex-1 lg:flex">
            {selected ? (
              <NotificationDetail
                notification={selected}
                isMarkingRead={markRead.isPending}
                onMarkRead={() => handleSelect(selected.id, false)}
                onOpenReceipt={() => setReceiptOpen(true)}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-2xl border border-tl-line bg-tl-surface text-sm text-tl-faint">
                Select a notification to view details
              </div>
            )}
          </div>
        </div>
      )}

      {receiptOpen && selected && (
        <ReceiptModal
          notification={selected}
          schoolName={user?.schoolName || "School"}
          schoolLogo={user?.schoolLogo || ""}
          receiptSettings={receiptSettings.data ?? null}
          onClose={() => setReceiptOpen(false)}
        />
      )}
    </div>
  );
}
