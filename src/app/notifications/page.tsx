"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  BookOpen,
  CheckCheck,
  CreditCard,
  Loader2,
  MessageCircle,
  RefreshCw,
  Settings,
  Shield,
  User,
  Volume2,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/CustomToast";
import {
  AdminNotification,
  getIncomingNotifications,
  markNotificationAsRead,
} from "../services/notification.service";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type Tab = "all" | "unread";

const categoryConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  fees: { icon: <CreditCard className="h-4 w-4" />, color: "bg-emerald-50 text-emerald-600" },
  payments: { icon: <CreditCard className="h-4 w-4" />, color: "bg-emerald-50 text-emerald-600" },
  academic: { icon: <BookOpen className="h-4 w-4" />, color: "bg-blue-50 text-blue-600" },
  academics: { icon: <BookOpen className="h-4 w-4" />, color: "bg-blue-50 text-blue-600" },
  grading: { icon: <BookOpen className="h-4 w-4" />, color: "bg-indigo-50 text-indigo-600" },
  resources: { icon: <BookOpen className="h-4 w-4" />, color: "bg-cyan-50 text-cyan-600" },
  messages: { icon: <MessageCircle className="h-4 w-4" />, color: "bg-purple-50 text-purple-600" },
  account: { icon: <User className="h-4 w-4" />, color: "bg-gray-50 text-gray-600" },
  announcement: { icon: <Volume2 className="h-4 w-4" />, color: "bg-amber-50 text-amber-600" },
  other: { icon: <Bell className="h-4 w-4" />, color: "bg-slate-50 text-slate-600" },
};

const sourceConfig: Record<string, { label: string; icon: React.ReactNode; pill: string }> = {
  talim: {
    label: "Talim",
    icon: <Shield className="h-3 w-3" />,
    pill: "bg-blue-100 text-blue-700",
  },
  system: {
    label: "System",
    icon: <Zap className="h-3 w-3" />,
    pill: "bg-gray-100 text-gray-600",
  },
  school: {
    label: "School",
    icon: <Settings className="h-3 w-3" />,
    pill: "bg-green-100 text-green-700",
  },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");

  const userId = user?.userId || (user as any)?._id || "";

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const items = await getIncomingNotifications(userId);
      setNotifications(items);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) load();
  }, [load, userId]);

  const handleMarkRead = useCallback(async (id: string, rawId: string) => {
    setReadIds((prev) => new Set([...prev, id]));
    await markNotificationAsRead(rawId);
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    notifications.forEach((n) => markNotificationAsRead(n.rawId).catch(() => {}));
    toast.success("All notifications marked as read");
  }, [notifications]);

  const isRead = (n: AdminNotification) => readIds.has(n.id);
  const unreadCount = notifications.filter((n) => !isRead(n)).length;

  const filtered =
    tab === "unread" ? notifications.filter((n) => !isRead(n)) : notifications;

  return (
    <div className="h-full overflow-y-auto bg-[#F7F9FC] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl flex flex-col gap-5">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#101828]">Notifications</h1>
            <p className="mt-1 text-sm text-[#667085]">
              Incoming alerts from Talim and system events.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg border border-[#DCE5F2] bg-white h-9 w-9 text-[#344054] hover:bg-gray-50 disabled:opacity-50 transition"
              title="Refresh"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-2 rounded-lg bg-[#003366] px-4 h-9 text-sm font-semibold text-white hover:bg-[#00264D] transition"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            )}
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-[#E8EDF5]">
          {(
            [
              ["all", "All"],
              ["unread", "Unread"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "px-4 pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2",
                tab === key
                  ? "border-[#0B63CE] text-[#0B63CE]"
                  : "border-transparent text-[#667085] hover:text-[#101828]"
              )}
            >
              {label}
              {key === "unread" && unreadCount > 0 && (
                <span className="inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#003366]" />
          </div>
        ) : error ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center">
            <p className="font-semibold text-red-600">{error}</p>
            <button
              onClick={load}
              className="rounded-lg bg-[#003366] px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center text-[#667085]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <p className="font-semibold text-[#101828]">
              {tab === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
            <p className="text-sm max-w-xs">
              {tab === "unread"
                ? "You're all caught up!"
                : "Alerts from Talim and system events like fee payments will appear here."}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#E5EAF2] bg-white shadow-sm overflow-hidden divide-y divide-[#EEF2F7]">
            {filtered.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                isRead={isRead(notification)}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  isRead,
  onMarkRead,
}: {
  notification: AdminNotification;
  isRead: boolean;
  onMarkRead: (id: string, rawId: string) => void;
}) {
  const catStyle =
    categoryConfig[notification.category] ?? categoryConfig.other;
  const srcStyle =
    sourceConfig[notification.source] ?? sourceConfig.system;

  return (
    <div
      className={cn(
        "flex gap-4 px-4 py-4 transition hover:bg-[#F8FBFF]",
        !isRead && "bg-[#F4F8FF]"
      )}
    >
      {/* Category icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          catStyle.color
        )}
      >
        {catStyle.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={cn(
                "text-sm text-[#101828] leading-snug",
                !isRead && "font-semibold"
              )}
            >
              {notification.title}
            </p>
            <p className="mt-0.5 text-sm text-[#667085] line-clamp-2 leading-snug">
              {notification.message}
            </p>
          </div>
          {!isRead && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* Source badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              srcStyle.pill
            )}
          >
            {srcStyle.icon}
            {srcStyle.label}
          </span>

          {/* Timestamp */}
          <span className="text-xs text-[#98A2B3]">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </span>

          {/* Mark as read */}
          {!isRead && (
            <button
              onClick={() => onMarkRead(notification.id, notification.rawId)}
              className="ml-auto text-xs font-medium text-[#0B63CE] hover:underline"
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
