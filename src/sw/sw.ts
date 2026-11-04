/// <reference lib="webworker" />
import { cacheName, strategyFor } from './sw-logic';

declare const self: ServiceWorkerGlobalScope & {
  __PRECACHE__: string[];
  __BUILD_ID__: string;
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName(self.__BUILD_ID__)).then((cache) => {
      return cache.addAll(self.__PRECACHE__);
    }),
  );
});

self.addEventListener('activate', (event) => {
  const currentCache = cacheName(self.__BUILD_ID__);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('gati-chitra-') && k !== currentCache)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const scope = new URL(self.registration.scope);
  const strategy = strategyFor(url, scope);

  if (strategy === 'bypass') return;

  const currentCache = cacheName(self.__BUILD_ID__);

  if (strategy === 'network-first') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(currentCache).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached =
            (await caches.match(event.request)) ||
            (await caches.match(event.request, { ignoreVary: true }));
          if (cached) return cached;
          const fallback =
            (await caches.match(self.registration.scope)) ||
            (await caches.match(self.registration.scope, { ignoreVary: true }));
          if (fallback) return fallback;
          throw new Error('Offline resource not found');
        }),
    );
    return;
  }

  if (strategy === 'cache-first') {
    event.respondWith(
      caches
        .match(event.request)
        .then((cached) => cached || caches.match(event.request, { ignoreVary: true }))
        .then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(currentCache).then((cache) => cache.put(event.request, clone));
            }
            return response;
          });
        }),
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'skipWaiting') {
    self.skipWaiting();
  }
});
