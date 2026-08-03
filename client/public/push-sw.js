/* Push handlers imported into the Workbox service worker.
   Workbox owns precaching and routing; this file only adds push behaviour. */

const DEFAULT_URL = '/admin/orders';
const ICON = '/icon-192.png';
const BADGE = '/icon-192.png';

const readPayload = (event) => {
  if (!event.data) return null;
  try {
    return event.data.json();
  } catch {
    return { title: 'Frioo', body: event.data.text() };
  }
};

const findClients = async () => {
  const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  return all;
};

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    const payload = readPayload(event);
    if (!payload) return;

    const tag = payload.tag || `frioo-${Date.now()}`;
    const url = payload.url || DEFAULT_URL;

    const windows = await findClients();

    windows.forEach((client) => {
      client.postMessage({ source: 'frioo-push', notification: payload });
    });

    const adminIsWatching = windows.some(
      (client) => client.visibilityState === 'visible' && client.url.includes('/admin')
    );

    const options = {
      body: payload.body || '',
      tag,
      renotify: false,
      icon: ICON,
      badge: BADGE,
      data: { url, type: payload.type || null, tag },
      actions: payload.actions || [],
      silent: adminIsWatching
    };

    await self.registration.showNotification(payload.title || 'Frioo', options);

    // A push must always produce a notification or the browser shows its own.
    // When an admin already has the panel open and visible, Realtime has
    // updated the screen, so the notification is retired immediately.
    if (adminIsWatching) {
      const shown = await self.registration.getNotifications({ tag });
      shown.forEach((notification) => notification.close());
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  const { action, notification } = event;
  notification.close();

  if (action === 'dismiss') return;

  const target = notification.data?.url || DEFAULT_URL;

  event.waitUntil((async () => {
    const windows = await findClients();
    const existing = windows.find((client) => client.url.includes('/admin'));

    if (existing) {
      await existing.focus();
      existing.postMessage({ source: 'frioo-push', navigate: target });
      return;
    }

    await self.clients.openWindow(target);
  })());
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil((async () => {
    try {
      const options = event.oldSubscription?.options;
      if (!options?.applicationServerKey) return;

      const renewed = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: options.applicationServerKey
      });

      const windows = await findClients();
      windows.forEach((client) => {
        client.postMessage({ source: 'frioo-push', resubscribed: renewed.toJSON() });
      });
    } catch {
      // The client re-registers on the next admin page load.
    }
  })());
});
