/* Talim School Admin — Web Push Service Worker */

/** "/messages?room=1" for an absolute or relative URL on this origin. */
function pathOf(url) {
  try {
    const parsed = new URL(url, self.location.origin);
    return parsed.origin === self.location.origin ? parsed.pathname + parsed.search : null;
  } catch {
    return null;
  }
}

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Talim", body: event.data.text() };
  }

  const payload = data.data || {};
  const options = {
    body: data.body || "",
    icon: data.icon || "/icons/icon-192x192.png",
    badge: data.badge || "/icons/badge-72x72.png",
    tag: data.tag || "talim-notification",
    renotify: Boolean(data.renotify || data.tag),
    data: payload,
    requireInteraction: data.requireInteraction || false,
    silent: false,
  };

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Skip it when a focused tab already shows this room.
      const target = payload.url ? pathOf(payload.url) : null;
      const alreadyOpen =
        target !== null && clientList.some((client) => client.focused && pathOf(client.url) === target);
      if (alreadyOpen) return undefined;
      return self.registration.showNotification(data.title || "Talim Notification", options);
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = pathOf(event.notification.data?.url || "/dashboard") || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          // The app routes to the URL itself, keeping its state.
          client.postMessage({ type: "OPEN_URL", url });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
      return undefined;
    })
  );
});
