const CACHE_NAME = 'picspanda-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/styles.css',
  './js/main.js',
  './images/picspanda-logo.svg',
  './manifest.json',
  './offline.html',
  './css/install-prompt.css',
  './js/pwa.js',
  './js/theme-toggle.js',
  './images/icons/icon-192x192.png',
  './images/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }
        // Otherwise try to fetch from network
        return fetch(event.request)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // Clone and cache response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          })
          .catch(() => {
            // If offline, return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('./offline.html');
            }
          });
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});
