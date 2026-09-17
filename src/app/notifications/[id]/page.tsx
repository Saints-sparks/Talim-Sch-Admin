"use client";

/**
 * One notification, opened from a push notification's deep link.
 *
 * This route used to render a hardcoded "System Maintenance Scheduled" message
 * whatever id it was given. It now reads the real notification — the API
 * refuses one the signed-in user may not see — and marks it read on arrival,
 * which is what tapping a push notification means.
 */
import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/StateComponents";
import { NotificationDetail } from "@/components/notifications/NotificationDetail";
import {
  useMarkNotificationRead,
  useNotification,
} from "@/hooks/notifications/useNotifications";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";

/**
 * The single-notification screen.
 */
export default function NotificationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const notificationId = typeof params.id === "string" ? params.id : "";

  const notification = useNotification(notificationId);
  const markRead = useMarkNotificationRead();
  const { mutate: markAsRead } = markRead;

  const isUnread = notification.data?.isRead === false;

  useEffect(() => {
    if (!notificationId || !isUnread) return;
    markAsRead(notificationId, {
      onError: (error) => logger.error("notifications", "Failed to mark notification read", error),
    });
  }, [notificationId, isUnread, markAsRead]);

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-[#F8F8F8] p-4 dark:bg-slate-900 sm:p-6">
      <button
        type="button"
        onClick={() => router.push("/notifications")}
        className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#E0E0E0] bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        All notifications
      </button>

      {notification.isLoading ? (
        <LoadingState message="Loading notification..." />
      ) : notification.isError ? (
        <ErrorState
          title="Couldn't open this notification"
          message={getErrorMessage(notification.error, "This notification is no longer available.")}
          onRetry={() => void notification.refetch()}
        />
      ) : notification.data ? (
        <div className="flex min-h-0 flex-1">
          <NotificationDetail
            notification={notification.data}
            isMarkingRead={markRead.isPending}
            onMarkRead={() => markAsRead(notificationId)}
          />
        </div>
      ) : null}
    </div>
  );
}
