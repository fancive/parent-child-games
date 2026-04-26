const CACHE = 'pcg-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/shared/utils.js',
  '/kitchen-game/index.html',
  '/kitchen-game/kitchen.html',
  '/kitchen-game/ride.html',
  '/kitchen-game/shared.js',
  '/kitchen-game/shared.css',
  '/bear-supermarket/index.html',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
