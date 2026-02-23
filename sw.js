// ─── SERVICE WORKER ───────────────────────────────────────────────────────────
// Version hochzählen wenn du die App aktualisierst, damit der Cache erneuert wird
const CACHE_NAME = 'meine-finanzen-v1';

const URLS_TO_CACHE = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap',
  'https://fonts.gstatic.com/s/dmseriffdisplay/v15/2Eb7L_JwClR7Zl_UAKZ0mFMV84oZ.woff2',
  'https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZOIHQ.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
];

// ─── INSTALL: Alles in den Cache laden ────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cache wird befüllt...');
      // Einzeln laden damit ein Fehler nicht alles blockiert
      return Promise.allSettled(
        URLS_TO_CACHE.map(url =>
          cache.add(url).catch(err => console.warn('Cache-Fehler für:', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE: Alte Caches löschen ────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => {
              console.log('Alter Cache gelöscht:', key);
              return caches.delete(key);
            })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH: Cache zuerst, dann Netzwerk ───────────────────────────────────────
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Aus Cache liefern (funktioniert offline)
        return cachedResponse;
      }
      // Nicht im Cache: vom Netzwerk laden und in Cache speichern
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline und nicht im Cache: für HTML die App zurückgeben
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
