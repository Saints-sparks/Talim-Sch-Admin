"use client";

/**
 * How a notification is badged and grouped in the inbox: the icon and colours
 * per category, the pill per source, and the tab filter.
 */
import React from "react";
import {
  Bell,
  BookOpen,
  CalendarOff,
  LifeBuoy,
  MessageCircle,
  Receipt,
  Settings,
  Shield,
  User,
  Volume2,
  Zap,
} from "lucide-react";
import type { AdminNotification, NotificationCategory } from "@/app/services/notification.service";

/** Icon and colours for one category. */
export interface CategoryBadge {
  icon: React.ReactNode;
  bg: string;
  text: string;
}

/** Badge per notification category, light and dark. */
export const CATEGORY_BADGES: Record<NotificationCategory, CategoryBadge> = {
  announcement: {
    icon: <Volume2 className="h-4 w-4" />,
    bg: "bg-tl-warning-bg",
    text: "text-tl-warning",
  },
  attendance: {
    icon: <User className="h-4 w-4" />,
    bg: "bg-tl-accent-bg",
    text: "text-tl-accent",
  },
  academics: {
    icon: <BookOpen className="h-4 w-4" />,
    bg: "bg-tl-select",
    text: "text-tl-link",
  },
  grading: {
    icon: <BookOpen className="h-4 w-4" />,
    bg: "bg-tl-select",
    text: "text-tl-accent",
  },
  resources: {
    icon: <BookOpen className="h-4 w-4" />,
    bg: "bg-tl-accent-bg",
    text: "text-tl-accent",
  },
  messages: {
    icon: <MessageCircle className="h-4 w-4" />,
    bg: "bg-tl-accent-bg",
    text: "text-tl-accent",
  },
  account: {
    icon: <User className="h-4 w-4" />,
    bg: "bg-tl-track",
    text: "text-tl-muted",
  },
  payments: {
    icon: <Receipt className="h-4 w-4" />,
    bg: "bg-tl-success-bg",
    text: "text-tl-success",
  },
  leave: {
    icon: <CalendarOff className="h-4 w-4" />,
    bg: "bg-tl-warning-bg",
    text: "text-tl-warning",
  },
  support: {
    icon: <LifeBuoy className="h-4 w-4" />,
    bg: "bg-tl-select",
    text: "text-tl-brand",
  },
  other: {
    icon: <Bell className="h-4 w-4" />,
    bg: "bg-tl-track",
    text: "text-tl-muted",
  },
};

/** Label per notification category, for the detail and receipt views. */
export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  announcement: "Announcement",
  attendance: "Attendance",
  academics: "Academics",
  grading: "Grading",
  resources: "Resources",
  messages: "Messages",
  account: "Account",
  payments: "Payments",
  leave: "Leave",
  support: "Support",
  other: "Other",
};

/** Pill per source, light and dark. */
export const SOURCE_BADGES = {
  talim: {
    label: "Talim",
    icon: <Shield className="h-3 w-3" />,
    pill: "bg-tl-select text-tl-link",
  },
  system: {
    label: "System",
    icon: <Zap className="h-3 w-3" />,
    pill: "bg-tl-track text-tl-muted",
  },
  school: {
    label: "School",
    icon: <Settings className="h-3 w-3" />,
    pill: "bg-tl-success-bg text-tl-success",
  },
} as const;

/** The inbox tabs, in the order they are shown. */
export const NOTIFICATION_TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "system", label: "System" },
  { key: "talim", label: "Talim" },
] as const;

/** One of the inbox tabs. */
export type NotificationTab = (typeof NOTIFICATION_TABS)[number]["key"];

/**
 * Applies the active tab to the inbox.
 *
 * @param notifications - The whole inbox.
 * @param tab - The active tab.
 * @returns The notifications to list.
 */
export function filterNotifications(
  notifications: AdminNotification[],
  tab: NotificationTab
): AdminNotification[] {
  if (tab === "unread") return notifications.filter((item) => !item.isRead);
  if (tab === "system") return notifications.filter((item) => item.source === "system");
  if (tab === "talim") return notifications.filter((item) => item.source === "talim");
  return notifications;
}

/**
 * Whether a notification is about money, and so worth offering a receipt for.
 *
 * Payment events carry the `payments` category (B11); older rows were filed
 * under `account`, so their text is read as before.
 *
 * @param notification - The notification.
 * @returns True when it is, or looks like, a payment.
 */
export function isPaymentNotification(notification: AdminNotification): boolean {
  if (notification.category === "payments") return true;
  const text = `${notification.title} ${notification.message}`.toLowerCase();
  return /payment|₦|\$|credited|wallet|fee paid|receipt/.test(text);
}

/**
 * The first currency amount mentioned in some text.
 *
 * @param text - The notification's message.
 * @returns The amount as written, or null.
 */
export function parseAmount(text: string): string | null {
  const match = text.match(/[₦$£€][\d,]+(?:\.\d{2})?/);
  return match ? match[0] : null;
}
