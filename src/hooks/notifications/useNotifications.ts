/**
 * The administrator's notification inbox.
 *
 * Notifications are per-user, so every key here carries the user id rather
 * than the school id — signing into another school must not reuse an inbox.
 *
 * The socket already tells the app when something arrives (the header bell
 * listens to the same event), so the inbox does not poll: a live event
 * invalidates the cached inbox and the unread count, and TanStack Query
 * refetches once, for whoever is actually looking.
 */
"use client";

import { useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { useAuth } from "@/context/AuthContext";
import { NOTIFICATION_RECEIVED_EVENT } from "@/context/ChatAlertsContext";
import {
  getIncomingNotifications,
  getNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AdminNotification,
} from "@/app/services/notification.service";

/**
 * The signed-in user's id, as the notification API expects it.
 *
 * @returns The user id, or `""` while the session is still loading.
 */
export function useNotificationUserId(): string {
  const { user } = useAuth();
  return user?.userId || user?._id || "";
}

/**
 * The signed-in administrator's inbox, newest first.
 *
 * Also subscribes to the socket's notification event for as long as the inbox
 * is on screen, so an arriving notification refreshes the list instead of
 * waiting for a poll.
 *
 * @returns Query result; `data` is undefined until the inbox lands.
 */
export function useNotifications(): UseQueryResult<AdminNotification[]> {
  const userId = useNotificationUserId();
  const client = useQueryClient();

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;

    const onLiveNotification = () => {
      void client.invalidateQueries({ queryKey: queryKeys.notifications.all });
    };
    window.addEventListener(NOTIFICATION_RECEIVED_EVENT, onLiveNotification);
    return () => window.removeEventListener(NOTIFICATION_RECEIVED_EVENT, onLiveNotification);
  }, [client, userId]);

  return useQuery({
    queryKey: queryKeys.notifications.list(userId || "none"),
    queryFn: () => getIncomingNotifications(userId),
    enabled: Boolean(userId),
    staleTime: staleTimes.list,
  });
}

/**
 * One notification, for the deep link a push notification opens.
 *
 * @param notificationId - The notification's id, or an empty string while the
 *   route param is still resolving.
 * @returns Query result.
 */
export function useNotification(notificationId: string): UseQueryResult<AdminNotification> {
  const userId = useNotificationUserId();

  return useQuery({
    queryKey: [...queryKeys.notifications.list(userId || "none"), "detail", notificationId],
    queryFn: () => getNotification(notificationId),
    enabled: Boolean(userId && notificationId),
    staleTime: staleTimes.list,
  });
}

/**
 * Marks one notification read.
 *
 * Read state belongs to the server, so the mutation invalidates the inbox and
 * the unread count rather than flipping a flag only this tab can see.
 *
 * @returns Mutation taking the notification's id.
 */
export function useMarkNotificationRead(): UseMutationResult<void, Error, string> {
  const client = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}

/**
 * Marks the whole inbox read in one request.
 *
 * @returns Mutation whose success drops the inbox and the unread count.
 */
export function useMarkAllNotificationsRead(): UseMutationResult<void, Error, void> {
  const client = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}
