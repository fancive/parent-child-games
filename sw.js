const CACHE = 'pcg-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './shared/utils.js',
  './shared/init.js',
  './shared/variables.css',
  './kitchen-game/index.html',
  './kitchen-game/kitchen.html',
  './kitchen-game/ride.html',
  './kitchen-game/shared.js',
  './kitchen-game/shared.css',
  './kitchen-game/shop.css',
  './kitchen-game/shop.js',
  './kitchen-game/cook.css',
  './kitchen-game/cook.js',
  './kitchen-game/ride.css',
  './kitchen-game/ride.js',
  './bear-supermarket/index.html',
  './bear-supermarket/styles.css',
  './bear-supermarket/data.js',
  './bear-supermarket/renderer.js',
  './bear-supermarket/game.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Stale-while-revalidate: serve cached immediately, fetch fresh in background
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(e.request).then((cached) => {
        const fetchPromise = fetch(e.request)
          .then((response) => {
            if (response.ok) {
              cache.put(e.request, response.clone());
            }
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      }),
    ),
  );
});
