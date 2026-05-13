const CACHE_NAME = 'provap-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Soft fail if some assets are missing during dev
        return cache.addAll(urlsToCache).catch(err => console.log('SW install cache error', err));
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          // Serve index.html for navigation requests offline mapping
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      }
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// ─── Push notifications ────────────────────────────────────────────────────
// Format attendu du payload :
// { title: string, body: string, url?: string, badge?: number, tag?: string }

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Pro'Vap Sevrage", body: event.data.text() };
  }

  const title = data.title || "Pro'Vap Sevrage";
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'provap-default',
    data: { url: data.url || '/' },
    requireInteraction: false,
  };

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, options);
      // Mettre à jour le badge sur l'icône (iOS 17+, Android, desktop)
      if (typeof data.badge === 'number' && self.navigator.setAppBadge) {
        try { await self.navigator.setAppBadge(data.badge); } catch {}
      }
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      // Réutiliser un onglet ouvert si possible
      for (const client of all) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })()
  );
});
