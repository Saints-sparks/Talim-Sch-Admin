"use client";

import React from "react";
import {
  ADMIN_NOTIF_DEFAULTS,
  useNotificationPrefs,
  useUpdateNotificationPrefs,
  type AdminNotifPrefs,
} from "@/hooks/settings/useNotificationPrefs";
import { PushNotificationToggle } from "@/components/notifications/PushNotificationToggle";
import {
  Card,
  CardHeader,
  SectionError,
  SectionHeader,
  SectionSkeleton,
  ToggleRow,
} from "@/components/settings/ui";

const TITLE = "Notifications";
const DESC = "Manage notification preferences and alerts";

const ALERTS: Array<{ field: keyof AdminNotifPrefs; label: string; desc: string }> = [
  { field: "announcementsEnabled", label: "Announcement notifications", desc: "Get notified when announcements are published" },
  { field: "feesEnabled", label: "Fee payment alerts", desc: "Notify when parents make payments or withdrawals" },
  { field: "attendanceEnabled", label: "Leave request alerts", desc: "Notify on new or updated leave requests" },
  { field: "resultsEnabled", label: "Result publishing alerts", desc: "Notify when results are published to parents" },
  { field: "messagesEnabled", label: "New message alerts", desc: "Notify when you receive a new message" },
];

const DELIVERY: Array<{ field: keyof AdminNotifPrefs; label: string; desc: string }> = [
  { field: "pushEnabled", label: "Push notifications", desc: "Send alerts to this device" },
  { field: "emailEnabled", label: "Email notifications", desc: "Receive updates via email" },
];

/**
 * Settings → Notifications: which alerts the signed-in administrator gets,
 * how they are delivered, and when to stay quiet.
 *
 * These are personal preferences, so every admin role may change their own —
 * nothing here is gated on `manage:settings`.
 */
export function NotificationsSection() {
  const { data, isLoading, isError, error, refetch } = useNotificationPrefs();
  const { save, savingField } = useUpdateNotificationPrefs();
  const prefs = data ?? ADMIN_NOTIF_DEFAULTS;

  if (isLoading) return <SectionSkeleton title={TITLE} desc={DESC} rows={3} />;
  if (isError) {
    return (
      <SectionError
        title={TITLE}
        desc={DESC}
        error={error}
        fallback="Failed to load your notification preferences."
        onRetry={() => refetch()}
      />
    );
  }

  const row = ({ field, label, desc }: { field: keyof AdminNotifPrefs; label: string; desc: string }) => (
    <ToggleRow
      key={field}
      label={label}
      desc={desc}
      checked={Boolean(prefs[field])}
      disabled={savingField === field}
      onChange={(v) => void save(field, v)}
    />
  );

  return (
    <div className="space-y-5">
      <SectionHeader title={TITLE} desc={DESC} />

      <Card>
        <CardHeader title="Notification Preferences" />
        <div className="px-5 pb-2 pt-1">{ALERTS.map(row)}</div>
      </Card>

      <Card>
        <CardHeader title="Delivery" />
        <div className="px-5 pb-2 pt-1">{DELIVERY.map(row)}</div>
      </Card>

      <Card>
        <CardHeader title="Browser Notifications" />
        <div className="px-5 pb-2 pt-1">
          <PushNotificationToggle />
        </div>
      </Card>

      <Card>
        <CardHeader title="Quiet Hours" />
        <div className="px-5 pb-2 pt-1">
          <ToggleRow
            label="Enable quiet hours"
            desc="Suppress non-urgent notifications between set times"
            checked={prefs.quietHoursEnabled}
            disabled={savingField === "quietHoursEnabled"}
            onChange={(v) => void save("quietHoursEnabled", v)}
          />
          {prefs.quietHoursEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3">
              {(["quietHoursStart", "quietHoursEnd"] as const).map((field) => (
                <div key={field}>
                  <label
                    htmlFor={field}
                    className="block text-xs text-gray-500 dark:text-slate-400 mb-1"
                  >
                    {field === "quietHoursStart" ? "Start time" : "End time"}
                  </label>
                  <input
                    id={field}
                    type="time"
                    value={prefs[field]}
                    disabled={savingField === field}
                    onChange={(e) => void save(field, e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003366] disabled:opacity-60"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
