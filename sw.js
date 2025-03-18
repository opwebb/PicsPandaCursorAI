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
  './js/theme-toggle.js'
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
      .then(response => response || fetch(event.request))
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
