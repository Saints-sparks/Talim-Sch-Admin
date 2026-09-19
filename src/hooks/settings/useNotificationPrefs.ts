/**
 * Settings → Notifications data: the signed-in administrator's own alert
 * preferences (`GET`/`PATCH /notifications/preferences`).
 *
 * The preferences belong to the user, not the school, so they are keyed by
 * user id.
 */
"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/components/CustomToast";
import { useAuth } from "@/context/AuthContext";
import { settingsKeys } from "@/hooks/settings/keys";
import { api } from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { staleTimes } from "@/lib/queryKeys";
import type { UpdateNotificationPreferencePayload } from "@/types/apiPayloads";

/**
 * The preferences this page shows. A subset of the backend
 * `UpdateNotificationPreferenceDto`; fields not listed here are left alone.
 */
export type AdminNotifPrefs = Required<
  Pick<
    UpdateNotificationPreferencePayload,
    | "announcementsEnabled"
    | "feesEnabled"
    | "attendanceEnabled"
    | "resultsEnabled"
    | "messagesEnabled"
    | "pushEnabled"
    | "emailEnabled"
    | "quietHoursEnabled"
    | "quietHoursStart" // "HH:mm", as the backend's pattern requires
    | "quietHoursEnd" // "HH:mm", as the backend's pattern requires
  >
>;

/** What a new account gets before it has saved anything. */
export const ADMIN_NOTIF_DEFAULTS: AdminNotifPrefs = {
  announcementsEnabled: true,
  feesEnabled: true,
  attendanceEnabled: true,
  resultsEnabled: false,
  messagesEnabled: true,
  pushEnabled: true,
  emailEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
};

/** Matches the backend's `quietHours*` pattern. */
const TIME_PATTERN = /^\d{2}:\d{2}$/;

/**
 * The administrator's notification preferences, falling back to the defaults
 * for anything the server has not stored yet.
 *
 * @returns Query result; `data` is always a complete preference set.
 */
export function useNotificationPrefs(): UseQueryResult<AdminNotifPrefs> {
  const { user } = useAuth();
  const userId = user?.userId ?? user?._id ?? null;

  return useQuery({
    queryKey: settingsKeys.notificationPrefs(userId ?? "none"),
    queryFn: async () => {
      const data = await api.get<Partial<AdminNotifPrefs> | null>("/notifications/preferences");
      return { ...ADMIN_NOTIF_DEFAULTS, ...(data ?? {}) };
    },
    enabled: Boolean(userId),
    staleTime: staleTimes.list,
  });
}

/** What {@link useUpdateNotificationPrefs} returns. */
export interface UpdateNotificationPrefs {
  /** Saves one preference. */
  save: <K extends keyof AdminNotifPrefs>(field: K, value: AdminNotifPrefs[K]) => Promise<void>;
  /** The field currently being saved, so only its own row is disabled. */
  savingField: keyof AdminNotifPrefs | null;
}

/**
 * Saves one preference at a time, optimistically, rolling the row back if the
 * request fails.
 *
 * @returns The save function and the field currently in flight.
 */
export function useUpdateNotificationPrefs(): UpdateNotificationPrefs {
  const client = useQueryClient();
  const { user } = useAuth();
  const key = settingsKeys.notificationPrefs(user?.userId ?? user?._id ?? "none");

  const mutation = useMutation({
    mutationFn: async ({ field, value }: { field: keyof AdminNotifPrefs; value: boolean | string }) => {
      if ((field === "quietHoursStart" || field === "quietHoursEnd") && !TIME_PATTERN.test(String(value))) {
        throw new Error("Enter a time as HH:mm");
      }
      const body: Partial<AdminNotifPrefs> = { [field]: value };
      await api.patch("/notifications/preferences", body satisfies UpdateNotificationPreferencePayload);
    },
    onMutate: async ({ field, value }) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<AdminNotifPrefs>(key);
      if (previous) client.setQueryData<AdminNotifPrefs>(key, { ...previous, [field]: value });
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
      logger.error("settings/notifications", "preference save failed", err);
      toast.error(getErrorMessage(err, "Failed to save preference. Please try again."));
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: key });
    },
  });

  return {
    save: (field, value) => mutation.mutateAsync({ field, value }),
    savingField: mutation.isPending ? (mutation.variables?.field ?? null) : null,
  };
}
