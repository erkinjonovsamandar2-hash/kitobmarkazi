/* ===== KITOBMARKAZI — Service Worker Self-Unregister (Clean Cache) ===== */
self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => caches.delete(key)));
    })
    .then(() => self.registration.unregister())
    .then(() => self.clients.claim())
  );
});
