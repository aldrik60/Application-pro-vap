const CACHE_NAME = 'provap-cache-v12';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json?v=5',
  '/favicon.svg?v=5',
  '/icons/icon-192.png?v=5',
  '/icons/icon-512.png?v=5',
  '/icons/apple-touch-icon.png?v=5',
];

self.addEventListener('install', (event) => {
  // Active immédiatement la nouvelle version sans attendre la fermeture des onglets
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache).catch(err => console.log('SW install cache error', err));
      })
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Stratégie network-first pour les navigations et les assets hachés (JS/CSS de Vite)
  // → garantit qu'on a toujours le dernier index.html et les bons bundles
  const isNavigate = req.mode === 'navigate';
  const isHashedAsset = /\/assets\/.+\-[A-Za-z0-9_]+\.(js|css)$/.test(new URL(req.url).pathname);

  if (isNavigate || isHashedAsset) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Met à jour le cache avec la réponse fraîche
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(c => c || caches.match('/index.html')))
    );
    return;
  }

  // Stratégie cache-first pour les icônes / manifest (changent rarement)
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Nettoie les anciens caches
      const names = await caches.keys();
      await Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      );
      // Prend le contrôle des onglets ouverts immédiatement
      await self.clients.claim();
    })()
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
