"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/apiError";
import { sessionStore } from "@/lib/session";
import {
  LEGACY_STORAGE_KEY,
  PUSH_STATE_EVENT,
  currentSubscription,
  disableWebPush,
  enableWebPush,
  endpointOwner,
  isPushSupported,
  rememberEndpoint,
  type PushPermission,
} from "@/lib/webPushSync";

export { reconcileWebPushForUser, revokeWebPushOnSignOut } from "@/lib/webPushSync";
export type { PushPermission } from "@/lib/webPushSync";

/** What {@link usePushNotifications} returns. */
export interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: PushPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

/**
 * Browser push for the signed-in admin: permission, subscription state and
 * subscribe / unsubscribe. `isSubscribed` reflects the browser's real
 * subscription, not a flag in storage. Permission is only ever requested from
 * `subscribe` (the toggle's click); keeping the backend in step with the
 * browser is `reconcileWebPushForUser`'s job.
 *
 * @returns The push state and its two actions.
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPushSupported()) return;
    setIsSupported(true);
    localStorage.removeItem(LEGACY_STORAGE_KEY);

    let cancelled = false;
    const refresh = () => {
      setPermission(Notification.permission as PushPermission);
      const userId = sessionStore.getUserId();
      currentSubscription()
        .then((subscription) => {
          if (cancelled) return;
          // Only "on" when the browser's subscription is this user's.
          const owner = subscription ? endpointOwner(subscription.endpoint) : null;
          const mine = Boolean(subscription) && (owner === null || owner === userId);
          if (subscription && mine && owner === null) rememberEndpoint(userId, subscription.endpoint);
          setIsSubscribed(mine && Notification.permission === "granted");
        })
        .catch(() => {
          if (!cancelled) setIsSubscribed(false);
        });
    };
    refresh();
    window.addEventListener(PUSH_STATE_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(PUSH_STATE_EVENT, refresh);
    };
  }, []);

  const subscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Only ever called from the toggle's click handler.
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult as PushPermission);

      if (permissionResult !== "granted") {
        throw new Error(
          permissionResult === "denied"
            ? "Notification permission was blocked. Please enable it in your browser settings."
            : "Notification permission was dismissed.",
        );
      }

      await enableWebPush(sessionStore.getUserId());
      setIsSubscribed(true);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to enable push notifications"));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await disableWebPush(sessionStore.getUserId());
      setIsSubscribed(false);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to disable push notifications"));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isSupported, permission, isSubscribed, isLoading, error, subscribe, unsubscribe };
}
