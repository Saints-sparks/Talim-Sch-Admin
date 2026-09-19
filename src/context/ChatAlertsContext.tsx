"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useWebSocketContext } from "@/context/WebSocketContext";
import type { NotificationData } from "@/hooks/useWebSocket";
import { chatService } from "@/app/services/chat.service";
import { reconcileWebPushForUser } from "@/app/hooks/usePushNotifications";
import { toast } from "@/components/CustomToast";
import { idOf } from "@/lib/chat/messages";
import { chatRoomUrl, openChatRoom, shouldAlertForActivity, toInAppPath } from "@/lib/chat/openRoom";
import type { RoomActivity } from "@/lib/chat/rooms";

/** Window event the header listens to so the bell refreshes immediately. */
export const NOTIFICATION_RECEIVED_EVENT = "talim:notification-received";

/** At most one toast per room in this window, so a busy group doesn't flood the screen. */
const TOAST_COOLDOWN_MS = 5_000;
const TITLE_PREFIX = /^\(\d+\+?\)\s/;

interface ChatAlertsContextValue {
  /** Unread chat messages across all rooms. */
  unreadTotal: number;
}

const ChatAlertsContext = createContext<ChatAlertsContextValue>({ unreadTotal: 0 });

/**
 * App-wide chat signals, mounted once under the socket provider: the unread
 * badge total, "Name: preview" toasts for messages in rooms that aren't open,
 * the `(N)` tab-title prefix, in-app notification events, and routing for
 * browser-push clicks.
 */
export function ChatAlertsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { subscribe, onConnect, onUnreadMessagesUpdate, onNotification, fetchUnreadCountViaSocket } =
    useWebSocketContext();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadTotal, setUnreadTotal] = useState(0);

  const userId = idOf(user?.userId || user?._id);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const lastToastRef = useRef(new Map<string, number>());

  // The API refuses everything but the password change until a temporary password is replaced.
  const mustChangePassword = Boolean(user?.mustChangePassword);

  // Initial total on sign-in; the socket keeps it current afterwards.
  useEffect(() => {
    if (!userId) {
      setUnreadTotal(0);
      return;
    }
    if (mustChangePassword) return;
    let active = true;
    chatService
      .getUnreadMessageCount()
      .then((count) => {
        if (active && typeof count === "number") setUnreadTotal(count);
      })
      .catch(() => undefined);
    void reconcileWebPushForUser(userId);
    return () => {
      active = false;
    };
  }, [userId, mustChangePassword]);

  useEffect(() => {
    const unsubConnect = onConnect(() => fetchUnreadCountViaSocket());

    const unsubUnread = onUnreadMessagesUpdate((data) => {
      if (typeof data?.unreadCount !== "number") return;
      if (data.userId && idOf(data.userId) !== userIdRef.current) return;
      setUnreadTotal(data.unreadCount);
    });

    const unsubActivity = subscribe("chat-room-activity", (activity: RoomActivity) => {
      const openRoomId = openChatRoom.get();
      if (
        !shouldAlertForActivity({
          activity,
          currentUserId: userIdRef.current,
          pathname: pathnameRef.current,
          openRoomId,
        })
      ) {
        return;
      }
      // The server's unread-messages-update follows and sets the exact total.
      setUnreadTotal((total) => total + 1);

      const roomId = idOf(activity.roomId);
      const now = Date.now();
      if (now - (lastToastRef.current.get(roomId) ?? 0) < TOAST_COOLDOWN_MS) return;
      lastToastRef.current.set(roomId, now);

      const name = activity.lastMessage?.senderName || "New message";
      const preview = activity.lastMessage?.preview || "Sent a message";
      toast.info(`${name}: ${preview}`, undefined, 6000, {
        onClick: () => router.push(chatRoomUrl(roomId)),
      });
    });

    const unsubNotification = onNotification((notification: NotificationData) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(NOTIFICATION_RECEIVED_EVENT, { detail: notification }));
      }
      // Chat alerts come from chat-room-activity.
      if (notification?.type === "chat_message") return;
      const body = notification?.body || notification?.message || "";
      if (notification?.title || body) toast.info(body || notification.title, body ? notification.title : undefined);
    });

    return () => {
      unsubConnect();
      unsubUnread();
      unsubActivity();
      unsubNotification();
    };
  }, [subscribe, onConnect, onUnreadMessagesUpdate, onNotification, fetchUnreadCountViaSocket, router]);

  // "(3) Talim" while there are unread messages; restored at 0. Re-applied when a page sets its own title.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const apply = () => {
      const base = document.title.replace(TITLE_PREFIX, "");
      const next = unreadTotal > 0 ? `(${unreadTotal > 99 ? "99+" : unreadTotal}) ${base}` : base;
      if (document.title !== next) document.title = next;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [unreadTotal]);

  // A click on a browser push while a tab is open: the service worker asks us to route.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; url?: unknown } | null;
      if (data?.type !== "OPEN_URL" && data?.type !== "NOTIFICATION_CLICK") return;
      const path = toInAppPath(data.url, window.location.origin);
      if (path) router.push(path);
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, [router]);

  return <ChatAlertsContext.Provider value={{ unreadTotal }}>{children}</ChatAlertsContext.Provider>;
}

export function useChatAlerts(): ChatAlertsContextValue {
  return useContext(ChatAlertsContext);
}
