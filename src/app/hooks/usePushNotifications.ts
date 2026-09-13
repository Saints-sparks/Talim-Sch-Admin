"use client";

import { useCallback, useEffect, useState } from "react";
import { api, apiClient } from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/apiError";
import { sessionStore } from "@/lib/session";

const LEGACY_STORAGE_KEY = "talim:push-subscribed";
/** Per-user record of which push endpoint this browser registered for them. */
const USER_STORAGE_PREFIX = "talim:push-subscribed:";
const SW_PATH = "/sw.js";
const ENDPOINTS = {
  vapidKey: "/notifications/web-push/vapid-public-key",
  subscribe: "/notifications/web-push/subscribe",
  preferences: "/notifications/preferences",
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

function pushSupported(): boolean {
  return (
    typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
  );
}

/** The browser's current push subscription for our service worker, if any. */
async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
  return (await registration?.pushManager.getSubscription()) ?? null;
}

/** Removes a subscription on the server. `DELETE` with a body, so it goes through the low-level client. */
function deleteServerSubscription(endpoint: string): Promise<unknown> {
  return apiClient.json(ENDPOINTS.subscribe, apiClient.bodyConfig("DELETE", { endpoint }, {}));
}

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function signedInUserId(): string | null {
  return sessionStore.getUserId();
}

function rememberEndpoint(userId: string | null, endpoint: string): void {
  const store = storage();
  if (!userId || !store) return;
  // An endpoint belongs to one account at a time.
  for (let i = store.length - 1; i >= 0; i--) {
    const key = store.key(i);
    if (key?.startsWith(USER_STORAGE_PREFIX) && store.getItem(key) === endpoint) store.removeItem(key);
  }
  store.setItem(`${USER_STORAGE_PREFIX}${userId}`, endpoint);
}

function forgetEndpoint(userId: string | null): void {
  if (userId) storage()?.removeItem(`${USER_STORAGE_PREFIX}${userId}`);
}

/** The user id another account registered `endpoint` under on this browser, if any. */
function endpointOwner(endpoint: string): string | null {
  const store = storage();
  if (!store) return null;
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (key?.startsWith(USER_STORAGE_PREFIX) && store.getItem(key) === endpoint) {
      return key.slice(USER_STORAGE_PREFIX.length);
    }
  }
  return null;
}

/**
 * On sign-in: if this browser's push subscription was registered by a
 * different account (e.g. their session expired without a sign-out), drop it
 * so the new user never sees the previous user's alerts. A subscription with
 * no recorded owner (made before owners were recorded) is adopted.
 * Never throws.
 */
export async function reconcileWebPushForUser(userId: string): Promise<void> {
  try {
    const subscription = await currentSubscription();
    if (!subscription) {
      forgetEndpoint(userId);
      return;
    }
    const owner = endpointOwner(subscription.endpoint);
    if (owner === userId) return;
    if (owner) {
      forgetEndpoint(owner);
      await subscription.unsubscribe();
      return;
    }
    rememberEndpoint(userId, subscription.endpoint);
  } catch {
    // Push is best-effort.
  }
}

/** Sync the browser push switch (`webPushEnabled`, independent of phones) — best-effort, never throws. */
async function syncPushPreference(enabled: boolean): Promise<void> {
  try {
    await api.patch(ENDPOINTS.preferences, { webPushEnabled: enabled });
  } catch {
    // Non-fatal: the browser subscription is the source of truth for delivery.
  }
}

/**
 * Stops this browser receiving the signed-in admin's push notifications.
 * Call before signing out, while the session is still valid, so the next
 * person to use this browser never gets the previous admin's alerts.
 * Never throws.
 */
export async function revokeWebPushOnSignOut(): Promise<void> {
  try {
    const subscription = await currentSubscription();
    if (!subscription) return;
    await deleteServerSubscription(subscription.endpoint).catch(() => undefined);
    await subscription.unsubscribe();
  } catch {
    // Sign-out must not fail because of push.
  } finally {
    storage()?.removeItem(LEGACY_STORAGE_KEY);
    forgetEndpoint(signedInUserId());
  }
}

export type PushPermission = "default" | "granted" | "denied";

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
 * subscription, not a flag in storage.
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pushSupported()) return;
    setIsSupported(true);
    setPermission(Notification.permission as PushPermission);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    const userId = signedInUserId();
    currentSubscription()
      .then((subscription) => {
        // Only "on" when the browser's subscription is this user's.
        const owner = subscription ? endpointOwner(subscription.endpoint) : null;
        const mine = Boolean(subscription) && (owner === null || owner === userId);
        if (subscription && mine && owner === null) rememberEndpoint(userId, subscription.endpoint);
        setIsSubscribed(mine && Notification.permission === "granted");
      })
      .catch(() => setIsSubscribed(false));
  }, []);

  const getOrRegisterSW = useCallback(async (): Promise<ServiceWorkerRegistration> => {
    let reg = await navigator.serviceWorker.getRegistration(SW_PATH);
    if (!reg) {
      reg = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
      await navigator.serviceWorker.ready;
    }
    return reg;
  }, []);

  const subscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult as PushPermission);

      if (permissionResult !== "granted") {
        throw new Error(
          permissionResult === "denied"
            ? "Notification permission was blocked. Please enable it in your browser settings."
            : "Notification permission was dismissed.",
        );
      }

      const [{ publicKey }, registration] = await Promise.all([
        api.get<{ publicKey: string }>(ENDPOINTS.vapidKey, { skipAuth: true }),
        getOrRegisterSW(),
      ]);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subJson = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      await api.post(ENDPOINTS.subscribe, {
        endpoint: subJson.endpoint,
        keys: subJson.keys,
        userAgent: navigator.userAgent,
      });

      rememberEndpoint(signedInUserId(), subJson.endpoint);
      setIsSubscribed(true);
      await syncPushPreference(true);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to enable push notifications"));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getOrRegisterSW]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await syncPushPreference(false);
      const subscription = await currentSubscription();
      if (subscription) {
        await deleteServerSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      forgetEndpoint(signedInUserId());
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
