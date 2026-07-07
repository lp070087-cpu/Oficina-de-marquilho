// Service Worker - Marquinho Moto Pecas
const CACHE_NAME = 'marquinho-v1';
const urlsToCache = ['/', '/dono', '/balcao', '/mecanico'];

self.addEventListener('install', (event) => {
  // @ts-ignore
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
  // @ts-ignore
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // @ts-ignore
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  // @ts-ignore
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // @ts-ignore
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
