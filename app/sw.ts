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
