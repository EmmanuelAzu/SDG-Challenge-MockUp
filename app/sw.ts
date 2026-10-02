/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker';
import { Serwist, NetworkOnly, type PrecacheEntry } from 'serwist';

declare const self: ServiceWorkerGlobalScope & { __SW_MANIFEST: (PrecacheEntry | string)[] };

new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    { matcher: ({ url }) => url.pathname.startsWith('/api/') || url.hostname.endsWith('supabase.co'), handler: new NetworkOnly() },
    ...defaultCache,
  ],
}).addEventListeners();

self.addEventListener('push', (event) => {
  const data = (() => { try { return event.data?.json() ?? {}; } catch { return {}; } })();
  event.waitUntil(self.registration.showNotification(data.title ?? 'Sisi', { body: data.body, icon: '/icons/icon-192.png', data: { url: data.url ?? '/home' } }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url ?? '/home'));
});
