/**
 * Browser web-push bookkeeping shared by the settings toggle, sign-in, sign-out
 * and the app-start reconcile.
 *
 * The backend keeps one row per push endpoint. Browsers can rotate or revoke
 * an endpoint behind the app's back, and the service worker (which has no
 * session token) is the first to hear about it:
 *
 * - `public/sw.js` re-subscribes on `pushsubscriptionchange` and leaves a note
 *   in the Cache API (`PENDING_URL`) naming the endpoints the server should
 *   forget, then pings open tabs.
 * - {@link reconcileWebPushForUser} (called once per signed-in user by the chat
 *   alerts provider) runs {@link reconcileWebPush} now and again whenever a tab
 *   is pinged or the browser permission changes.
 *
 * A per-user localStorage key records which endpoint this browser registered
 * for that user: its presence is the "this user turned browser push on" flag.
 *
 * Everything here is best-effort and never throws, and nothing here ever asks
 * for notification permission: that only happens from a user gesture.
 */
import { API_BASE_URL } from "@/app/lib/api/config";
import { api } from "@/lib/apiClient";
import { sessionStore } from "@/lib/session";

/** The old flag shared by every user on a browser. */
export const LEGACY_STORAGE_KEY = "talim:push-subscribed";
/** Per-user record of which push endpoint this browser registered for them. */
export const USER_STORAGE_PREFIX = "talim:push-subscribed:";
/** Path of the service worker that receives pushes. */
export const SW_PATH = "/sw.js";
/** Cache the service worker and the page share notes in. Mirrors `public/sw.js`. */
export const SYNC_CACHE = "talim-push-sync";
/** Note left by the service worker: endpoints the server should forget. Mirrors `public/sw.js`. */
export const PENDING_URL = "/__talim_push__/pending";
/** Note left by the page: what the service worker needs to re-subscribe alone. Mirrors `public/sw.js`. */
export const CONFIG_URL = "/__talim_push__/config";
/** Fired on `window` when reconcile changed what the toggle should show. */
export const PUSH_STATE_EVENT = "talim:push-state-changed";

const ENDPOINTS = {
  vapidKey: "/notifications/web-push/vapid-public-key",
  subscribe: "/notifications/web-push/subscribe",
  preferences: "/notifications/preferences",
};

/** The browser's notification permission for this origin. */
export type PushPermission = "default" | "granted" | "denied";

/** What {@link reconcileWebPush} did. */
export type ReconcileResult =
  | "unsupported"
  | "no-user"
  | "idle"
  | "healed"
  | "resubscribed"
  | "cleared"
  | "dropped"
  | "failed";

/**
 * Whether this browser can do web push at all.
 *
 * @returns True when service workers, PushManager and Notification all exist.
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
  );
}

/**
 * Decodes a URL-safe base64 VAPID key into the bytes `pushManager.subscribe` expects.
 *
 * @param base64String - The public key from the server.
 * @returns The decoded key.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

/**
 * `localStorage`, or `null` when the browser denies access.
 *
 * @returns The storage, or `null`.
 */
function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

/**
 * Records that this browser registered `endpoint` for `userId`. An endpoint
 * belongs to one account at a time.
 *
 * @param userId - The signed-in user.
 * @param endpoint - The endpoint just registered.
 */
export function rememberEndpoint(userId: string | null, endpoint: string): void {
  const store = storage();
  if (!userId || !store) return;
  for (let i = store.length - 1; i >= 0; i--) {
    const key = store.key(i);
    if (key?.startsWith(USER_STORAGE_PREFIX) && store.getItem(key) === endpoint) store.removeItem(key);
  }
  store.setItem(`${USER_STORAGE_PREFIX}${userId}`, endpoint);
}

/**
 * Forgets the endpoint recorded for a user (their "turned on" flag).
 *
 * @param userId - The user whose record to drop.
 */
export function forgetEndpoint(userId: string | null): void {
  if (userId) storage()?.removeItem(`${USER_STORAGE_PREFIX}${userId}`);
}

/**
 * The endpoint this browser registered for a user, if they turned push on.
 *
 * @param userId - The user.
 * @returns The endpoint, or `null` when they have not.
 */
export function storedEndpoint(userId: string): string | null {
  const value = storage()?.getItem(`${USER_STORAGE_PREFIX}${userId}`) ?? null;
  return value && value.startsWith("http") ? value : null;
}

/**
 * The user id another account registered `endpoint` under on this browser, if any.
 *
 * @param endpoint - A push endpoint.
 * @returns The owning user id, or `null` when no account claims it.
 */
export function endpointOwner(endpoint: string): string | null {
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
 * Reads a JSON note from the cache shared with the service worker.
 *
 * @param url - The note's key.
 * @returns The parsed note, or `null` when missing or unreadable.
 */
async function readNote<T>(url: string): Promise<T | null> {
  try {
    if (typeof caches === "undefined") return null;
    const cache = await caches.open(SYNC_CACHE);
    const response = await cache.match(url);
    return response ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Writes (or with `null`, removes) a JSON note in the shared cache.
 *
 * @param url - The note's key.
 * @param value - The note, or `null` to delete it.
 */
async function writeNote(url: string, value: unknown): Promise<void> {
  try {
    if (typeof caches === "undefined") return;
    const cache = await caches.open(SYNC_CACHE);
    if (value === null) {
      await cache.delete(url);
      return;
    }
    await cache.put(url, new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json" } }));
  } catch {
    // Notes are a hint: reconcile also works from what the browser holds.
  }
}

/** What the service worker needs to re-subscribe without the page. */
interface SyncConfig {
  apiBaseUrl?: string;
  vapidKey?: string;
}

/**
 * Tells the service worker where the API is and which VAPID key we use, so it
 * can re-subscribe when no tab is open.
 *
 * @param config - Fields to merge into the saved config.
 */
async function saveSyncConfig(config: SyncConfig): Promise<void> {
  const existing = (await readNote<SyncConfig>(CONFIG_URL)) ?? {};
  await writeNote(CONFIG_URL, { ...existing, apiBaseUrl: API_BASE_URL, ...config });
}

/**
 * The endpoints the service worker says the server should forget.
 *
 * @returns Stale endpoints, or an empty list.
 */
async function readStaleEndpoints(): Promise<string[]> {
  const pending = await readNote<{ staleEndpoints?: string[] }>(PENDING_URL);
  return pending?.staleEndpoints ?? [];
}

/**
 * The browser's current push subscription for our service worker.
 *
 * @returns The subscription, or `null` when there is none or push is unsupported.
 */
export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
  return (await registration?.pushManager.getSubscription()) ?? null;
}

/**
 * The service worker registration, registering it the first time.
 *
 * @returns The registration.
 */
async function getOrRegisterSW(): Promise<ServiceWorkerRegistration> {
  let registration = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (!registration) {
    registration = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
    await navigator.serviceWorker.ready;
  }
  return registration;
}

/**
 * Subscribes this browser to push with the server's key. Permission has
 * already been granted; this never prompts.
 *
 * @returns The subscription and the key it was made with.
 */
async function subscribeBrowser(): Promise<{ subscription: PushSubscription; vapidKey: string }> {
  const [{ publicKey: vapidKey }, registration] = await Promise.all([
    // Public route: a 401 must not trigger a refresh.
    api.get<{ publicKey: string }>(ENDPOINTS.vapidKey, { skipAuth: true }),
    getOrRegisterSW(),
  ]);
  if (!vapidKey) throw new Error("Unable to load push configuration from server");
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });
  return { subscription, vapidKey };
}

/**
 * Registers a subscription with the backend (idempotent on the endpoint).
 *
 * @param subscription - The browser's subscription.
 * @returns The endpoint that was registered.
 */
async function registerSubscription(subscription: PushSubscription): Promise<string> {
  const { endpoint, keys } = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  await api.post(ENDPOINTS.subscribe, { endpoint, keys, userAgent: navigator.userAgent });
  return endpoint;
}

/**
 * Asks the backend to forget an endpoint. `DELETE` carries a body, so it goes
 * through the client's low-level config.
 *
 * @param endpoint - The push endpoint.
 */
export async function forgetServerSubscription(endpoint: string): Promise<void> {
  await api.delete(ENDPOINTS.subscribe, {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
}

/**
 * Syncs `webPushEnabled` (browsers only; `pushEnabled` is the phone switch) to
 * the backend preferences. Best-effort, never throws.
 *
 * @param enabled - The new value.
 */
async function syncWebPushPreference(enabled: boolean): Promise<void> {
  try {
    await api.patch(ENDPOINTS.preferences, { webPushEnabled: enabled });
  } catch {
    // Non-fatal: the browser subscription is the source of truth for delivery.
  }
}

/**
 * Turns browser push on for a user who just asked to (permission has already
 * been granted by the toggle's click). Throws so the toggle can show the failure.
 *
 * @param userId - The signed-in user, when known.
 */
export async function enableWebPush(userId: string | null): Promise<void> {
  const { subscription, vapidKey } = await subscribeBrowser();
  const endpoint = await registerSubscription(subscription);
  rememberEndpoint(userId, endpoint);
  await writeNote(PENDING_URL, null);
  await saveSyncConfig({ vapidKey });
  await syncWebPushPreference(true);
}

/**
 * Turns browser push off for a user who just asked to. Throws so the toggle
 * can show the failure.
 *
 * @param userId - The signed-in user, when known.
 */
export async function disableWebPush(userId: string | null): Promise<void> {
  await syncWebPushPreference(false);
  const subscription = await currentSubscription();
  if (subscription) {
    await forgetServerSubscription(subscription.endpoint);
    await subscription.unsubscribe();
  }
  forgetEndpoint(userId);
  await writeNote(PENDING_URL, null);
}

/** Tells any mounted toggle to re-read the browser's state. */
function notifyStateChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PUSH_STATE_EVENT));
}

/**
 * Makes the backend agree with the browser for the signed-in user. Safe to
 * call as often as you like and never prompts:
 *
 * - a subscription another account registered here is dropped (a shared
 *   browser must not deliver the previous admin's alerts); one nobody claims
 *   is adopted;
 * - permission `granted` and a subscription held: re-register it (idempotent),
 *   and forget endpoints the service worker says were rotated away;
 * - permission `granted` but the subscription is gone: re-subscribe silently;
 * - permission `denied` / `default` while the user was subscribed: clear the
 *   flag and forget the server record.
 *
 * @param userId - The signed-in user; without one there is nothing to do.
 * @returns What happened. Never throws.
 */
export async function reconcileWebPush(userId: string | null | undefined): Promise<ReconcileResult> {
  try {
    if (!isPushSupported()) return "unsupported";
    if (!userId) return "no-user";

    let subscription = await currentSubscription();
    // Read before anything below can overwrite it: after a rotation this is
    // the old endpoint the server still holds.
    let previous = storedEndpoint(userId);
    if (subscription) {
      const owner = endpointOwner(subscription.endpoint);
      if (owner && owner !== userId) {
        forgetEndpoint(owner);
        await subscription.unsubscribe();
        notifyStateChanged();
        return "dropped";
      }
      // Made before owners were recorded: adopt it.
      if (!owner && !previous && Notification.permission === "granted") {
        rememberEndpoint(userId, subscription.endpoint);
        previous = subscription.endpoint;
      }
    }

    if (!previous) return "idle";

    if (Notification.permission !== "granted") {
      await clearRevoked(userId, previous, subscription);
      notifyStateChanged();
      return "cleared";
    }

    let resubscribed = false;
    let vapidKey: string | undefined;
    if (!subscription) {
      ({ subscription, vapidKey } = await subscribeBrowser());
      resubscribed = true;
    }

    const endpoint = await registerSubscription(subscription);
    const stale = new Set([...(await readStaleEndpoints()), previous]);
    stale.delete(endpoint);
    await Promise.allSettled([...stale].map((old) => forgetServerSubscription(old)));

    rememberEndpoint(userId, endpoint);
    await writeNote(PENDING_URL, null);
    await saveSyncConfig(vapidKey ? { vapidKey } : {});
    if (resubscribed || stale.size > 0) notifyStateChanged();
    return resubscribed ? "resubscribed" : "healed";
  } catch {
    return "failed";
  }
}

/**
 * The browser took notifications away (or reset them) while we thought we were
 * subscribed: forget the flag first, then tell the server.
 *
 * @param userId - The user whose subscription is gone.
 * @param previous - The endpoint recorded for them.
 * @param subscription - What the browser still holds, if anything.
 */
async function clearRevoked(userId: string, previous: string, subscription: PushSubscription | null): Promise<void> {
  forgetEndpoint(userId);
  const endpoints = new Set([...(await readStaleEndpoints()), previous]);
  if (subscription) endpoints.add(subscription.endpoint);
  await Promise.allSettled([
    ...[...endpoints].map((endpoint) => forgetServerSubscription(endpoint)),
    subscription ? subscription.unsubscribe() : Promise.resolve(),
  ]);
  await writeNote(PENDING_URL, null);
}

/**
 * Listens for the service worker's "subscription rotated" ping and for the
 * browser permission changing, and reconciles on each.
 *
 * @param userId - The signed-in user.
 * @returns A function that stops listening.
 */
export function startWebPushSync(userId: string): () => void {
  if (!isPushSupported()) return () => undefined;
  const run = (): void => {
    void reconcileWebPush(userId);
  };

  const onMessage = (event: MessageEvent): void => {
    if ((event.data as { type?: string } | null)?.type === "PUSH_SUBSCRIPTION_CHANGED") run();
  };
  navigator.serviceWorker.addEventListener("message", onMessage);

  let permissionStatus: PermissionStatus | null = null;
  let disposed = false;
  navigator.permissions
    ?.query({ name: "notifications" })
    .then((status) => {
      if (disposed) return;
      permissionStatus = status;
      status.addEventListener("change", run);
    })
    .catch(() => undefined);

  return () => {
    disposed = true;
    navigator.serviceWorker.removeEventListener("message", onMessage);
    permissionStatus?.removeEventListener("change", run);
  };
}

let activeSync: { userId: string; stop: () => void } | null = null;

/**
 * On sign-in (and whenever the signed-in user changes): reconcile this
 * browser's push subscription with that user, and keep it reconciled while
 * they stay signed in. See {@link reconcileWebPush}. Never throws.
 *
 * @param userId - The signed-in user.
 */
export async function reconcileWebPushForUser(userId: string): Promise<void> {
  if (activeSync?.userId !== userId) {
    activeSync?.stop();
    activeSync = { userId, stop: startWebPushSync(userId) };
  }
  await reconcileWebPush(userId);
}

/**
 * Stops this browser receiving the signed-in admin's push notifications. Call
 * before signing out, while the session is still valid, so the next person to
 * use this browser never gets the previous admin's alerts. Never throws.
 */
export async function revokeWebPushOnSignOut(): Promise<void> {
  const userId = sessionStore.getUserId();
  activeSync?.stop();
  activeSync = null;
  try {
    const subscription = await currentSubscription();
    const stored = userId ? storedEndpoint(userId) : null;
    const endpoints = new Set<string>(stored ? [stored] : []);
    if (subscription) endpoints.add(subscription.endpoint);
    await Promise.allSettled([...endpoints].map((endpoint) => forgetServerSubscription(endpoint)));
    await subscription?.unsubscribe();
  } catch {
    // Sign-out must not fail because of push.
  } finally {
    storage()?.removeItem(LEGACY_STORAGE_KEY);
    forgetEndpoint(userId);
    await writeNote(PENDING_URL, null);
  }
}

/**
 * Drops this browser's push subscription and the per-user flag **without any
 * request**, for a forced sign-out (the session expired or could not be
 * refreshed). The token is already invalid there, so telling the server would
 * 401, try to refresh, fail, and trigger the same sign-out again. The server's
 * row is removed by its own 404/410 cleanup the next time it tries to send to
 * the dead endpoint. Never throws.
 *
 * @param userId - The user being signed out, when known.
 */
export async function dropLocalWebPush(userId: string | null): Promise<void> {
  activeSync?.stop();
  activeSync = null;
  try {
    const subscription = await currentSubscription();
    await subscription?.unsubscribe();
  } catch {
    // A forced sign-out must not fail because of push.
  } finally {
    storage()?.removeItem(LEGACY_STORAGE_KEY);
    forgetEndpoint(userId);
    await writeNote(PENDING_URL, null).catch(() => undefined);
  }
}
