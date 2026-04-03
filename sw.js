// ─── SERVICE WORKER ───────────────────────────────────────────────────────────
// VERSION bei jedem GitHub-Upload erhöhen: v1 → v2 → v3 ...
const VERSION = 'meine-finanzen-v2';
const ASSETS = ['./index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)));
  // Kein skipWaiting — warten bis Nutzer Update bestätigt
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Network First: immer frische Version wenn online, Cache als Fallback
self.addEventListener('fetch', e => {
  if (e.request.url.includes('fonts.googleapis.com')) return;
  if (e.request.url.includes('fonts.gstatic.com')) return;
  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response.ok) {
          caches.open(VERSION).then(c => c.put(e.request, response.clone()));
        }
        return response;
      })
      .catch(() =>
        caches.match(e.request)
          .then(cached => cached || caches.match('./index.html'))
      )
  );
});
