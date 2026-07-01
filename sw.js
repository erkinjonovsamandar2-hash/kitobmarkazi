/* ===== KITOBMARKAZI — Service Worker (PWA) ===== */
const CACHE_NAME = 'km-v1';
const ASSETS = [
  'index.html',
  'style.css',
  'data.js',
  'cart.js',
  'kmChat.js',
  'images/logo-main.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
