"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { WebSocketStatus } from "./WebSocketStatus";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "./theme-toggle";
import { getUnreadNotificationCount } from "@/app/services/notification.service";
import { NOTIFICATION_RECEIVED_EVENT } from "@/context/ChatAlertsContext";
import { focusRing } from "@/components/tl/styles";

/**
 * Initials for the avatar: the first letters of the first and last names.
 *
 * @param first - First name.
 * @param last - Last name.
 * @returns One or two capitals, or "U".
 */
export function headerInitials(first?: string, last?: string): string {
  return `${first?.trim().charAt(0) ?? ""}${last?.trim().charAt(0) ?? ""}`.toUpperCase() || "U";
}

/**
 * The top bar in the portals' design: the menu button (below 980px), the
 * school's logo and name, today's date, the live-connection status, the
 * theme menu, notifications with an unread badge, and the admin's avatar
 * linking to their profile.
 *
 * The unread count comes from `GET /notifications/unread-count`, refreshed
 * every 30 seconds and whenever a socket notification arrives.
 *
 * @returns The header.
 */
export function Header() {
  const { isMobileOpen, setMobileOpen } = useSidebar();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    const userId = user?.userId ?? user?._id;
    if (!userId) return;

    const fetchUnread = () =>
      getUnreadNotificationCount(userId)
        .then(setUnreadCount)
        .catch(() => {});

    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    // A socket notification just arrived: refresh the bell now.
    window.addEventListener(NOTIFICATION_RECEIVED_EVENT, fetchUnread);
    return () => {
      clearInterval(interval);
      window.removeEventListener(NOTIFICATION_RECEIVED_EVENT, fetchUnread);
    };
  }, [user?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const initials = headerInitials(user?.firstName, user?.lastName);
  const schoolName = user?.schoolName || "Your school";
  const unread = unreadCount > 0 ? unreadCount : 0;
  const showLogo = Boolean(user?.schoolLogo) && !logoFailed;

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-tl-line bg-tl-surface px-[clamp(14px,3vw,26px)] py-3 font-manrope text-tl-ink">
      <button
        type="button"
        id="hamburger-menu"
        onClick={() => setMobileOpen(!isMobileOpen)}
        aria-label={isMobileOpen ? "Close the menu" : "Open sidebar"}
        aria-expanded={isMobileOpen}
        aria-controls="mobile-sidebar"
        className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-tl-line min-[980px]:hidden ${focusRing}`}
      >
        <span aria-hidden className="h-0.5 w-[18px] rounded bg-tl-brand" />
        <span aria-hidden className="h-0.5 w-[18px] rounded bg-tl-brand" />
        <span aria-hidden className="h-0.5 w-[18px] rounded bg-tl-brand" />
      </button>

      <div className="flex min-w-[120px] flex-1 items-center gap-2.5">
        {showLogo ? (
          <img
            src={user?.schoolLogo}
            alt=""
            className="h-8 w-8 shrink-0 rounded-[9px] object-cover"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span aria-hidden className="h-8 w-8 shrink-0 rounded-[9px] bg-tl-success-bg" />
        )}
        <div className="truncate text-[15px] font-bold text-tl-ink">{schoolName}</div>
      </div>

      <div className="hidden whitespace-nowrap text-sm text-tl-muted min-[560px]:block">
        {format(new Date(), "EEE, d MMM yyyy")}
      </div>

      <div className="hidden min-[720px]:block">
        <WebSocketStatus />
      </div>

      <ThemeToggle />

      <Link
        href="/notifications"
        title="Announcements, reminders and alerts"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-tl-line hover:bg-tl-bg ${focusRing}`}
      >
        <Bell className="h-[19px] w-[19px] text-tl-brand" aria-hidden />
        {unread > 0 ? (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-tl-surface bg-tl-danger px-[5px] text-[11px] font-extrabold text-white dark:text-tl-bg"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </Link>

      <Link
        href="/profile"
        title="Your profile"
        aria-label="Your profile"
        className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-tl-select text-[13px] font-extrabold text-tl-brand ${focusRing}`}
      >
        {user?.userAvatar ? (
          <img src={user.userAvatar} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </Link>
    </header>
  );
}
