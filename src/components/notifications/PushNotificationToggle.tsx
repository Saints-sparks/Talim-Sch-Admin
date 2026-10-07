"use client";

import { usePushNotifications } from "@/app/hooks/usePushNotifications";

export function PushNotificationToggle() {
  const { isSupported, permission, isSubscribed, isLoading, error, subscribe, unsubscribe } =
    usePushNotifications();

  if (!isSupported) {
    return (
      <div className="flex items-center justify-between py-3">
        <div>
          <p className="text-sm font-bold text-tl-ink">Browser Notifications</p>
          <p className="text-xs text-tl-muted mt-0.5">Not supported in this browser</p>
        </div>
        <span className="rounded-full bg-tl-track px-2.5 py-1 text-xs font-extrabold text-tl-muted">Unavailable</span>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="py-3" role="status">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-tl-ink">Browser Notifications</p>
          <span className="flex-shrink-0 rounded-full bg-tl-track px-2.5 py-1 text-xs font-extrabold text-tl-muted">
            Off in this browser
          </span>
        </div>
        <p className="mt-1 text-xs text-tl-muted">
          Your browser is set not to show Talim alerts, so you will not see pop-up notifications while Talim is closed
          or in the background. Notifications inside Talim keep working as usual.
        </p>
        <p className="mt-1 text-xs text-tl-muted">
          To turn them back on, open this site&apos;s settings from your browser&apos;s address bar (usually the icon
          beside the web address), set Notifications to Allow, and reload the page.
        </p>
      </div>
    );
  }

  const handleToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } catch {
      // error displayed via hook state
    }
  };

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-bold text-tl-ink">Browser Notifications</p>
        <p className="text-xs text-tl-muted mt-0.5">
          {isSubscribed
            ? "Receive Talim alerts and school announcements in this browser."
            : "Get notified about school updates and Talim alerts even when the tab is closed."}
        </p>
        {error && <p className="mt-1 text-xs font-semibold text-tl-danger" role="alert">{error}</p>}
      </div>

      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        aria-label={isSubscribed ? "Disable browser notifications" : "Enable browser notifications"}
        aria-pressed={isSubscribed}
        className="flex min-h-[44px] flex-shrink-0 cursor-pointer items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tl-link focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span
          aria-hidden
          className={`flex h-[29px] w-[50px] rounded-full p-[3px] transition-colors ${
            isSubscribed ? "justify-end bg-tl-brand-fill" : "justify-start bg-tl-control"
          }`}
        >
          <span className="h-[23px] w-[23px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
        </span>
      </button>
    </div>
  );
}
