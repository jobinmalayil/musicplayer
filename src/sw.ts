/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkOnly } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import type { WorkboxPlugin } from 'workbox-core/types.js';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

/**
 * Our stream proxy always answers with a capped ~4MB 206 chunk (Vercel's
 * response-size limit means it can never return one complete cacheable
 * file), so the standard RangeRequestsPlugin — which slices ranges out of a
 * single fully-cached response — doesn't fit. Instead each distinct byte
 * range gets its own cache entry, keyed by appending the Range header to
 * the cache key. A track played start-to-finish while online ends up with
 * all of its chunks cached, so replaying it offline serves the same
 * sequence of range requests straight from cache. Seeking to a byte range
 * that was never fetched online still requires a network connection.
 */
const rangeAwareCacheKey: WorkboxPlugin = {
  cacheKeyWillBeUsed: async ({ request }) => {
    const range = request.headers.get('range');
    if (!range) return request;
    const url = new URL(request.url);
    url.searchParams.set('__range', range);
    return url.toString();
  },
};

registerRoute(
  ({ url }) => url.pathname === '/api/drive' && url.searchParams.get('action') === 'stream',
  new CacheFirst({
    cacheName: 'audio-stream-cache',
    plugins: [
      rangeAwareCacheKey,
      new CacheableResponsePlugin({ statuses: [0, 200, 206] }),
      new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
);

// Everything else under /api/ (folder listings, search, breadcrumbs) is
// dynamic Drive data — never cache it.
registerRoute(({ url }) => url.pathname.startsWith('/api/'), new NetworkOnly());

self.skipWaiting();
