const CACHE_NAME = 'provap-cache-v13';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json?v=5',
  '/favicon.svg?v=5',
  '/icons/icon-192.png?v=5',
  '/icons/icon-512.png?v=5',
  '/icons/apple-touch-icon.png?v=5',
  // Mascotte Vap : affichée dès l'accueil, doit rester visible hors connexion
  '/assets/vap/vap-1-premier-jour.svg',
  '/assets/vap/vap-2-premier-souffle.svg',
  '/assets/vap/vap-3-sur-ses-pieds.svg',
  '/assets/vap/vap-4-en-marche.svg',
  '/assets/vap/vap-5-ascension.svg',
  '/assets/vap/vap-6-au-sommet.svg',
  '/assets/logo-provap-blanc.svg',
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
  // Les images locales de /assets/ sont gardées en cache au premier chargement.
  const url = new URL(req.url);
  const isLocalImage = req.method === 'GET' && url.origin === self.location.origin && url.pathname.startsWith('/assets/') && !isHashedAsset;
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (isLocalImage && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
        }
        return res;
      });
    })
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
