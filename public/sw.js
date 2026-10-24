const CACHE_NAME = 'provap-cache-v14';
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

// Délai maximal d'attente du réseau avant de servir la copie locale
// (wifi sans internet : sans plafond, l'écran resterait blanc longtemps).
const NAV_TIMEOUT = 4000;
const ASSET_TIMEOUT = 8000;
const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // On laisse passer sans y toucher : les POST, les autres sites (Supabase,
  // YouTube, polices) et /api.
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  // Réseau d'abord (avec délai maximal) pour les pages et les JS/CSS hachés de Vite.
  const isNavigate = req.mode === 'navigate';
  const isHashedAsset = /\/assets\/.+-[A-Za-z0-9_-]+\.(js|css)$/.test(url.pathname);

  if (isNavigate || isHashedAsset) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const res = await Promise.race([fetch(req), timeout(isNavigate ? NAV_TIMEOUT : ASSET_TIMEOUT)]);
        // On ne garde que les bonnes réponses du bon type : jamais une erreur,
        // ni une page HTML reçue à la place d'un fichier JS.
        const type = res.headers.get('content-type') || '';
        const goodType = isNavigate ? type.includes('text/html') : !type.includes('text/html');
        if (res.ok && res.type === 'basic' && goodType && !url.search.includes('code=')) {
          cache.put(isNavigate ? '/index.html' : req, res.clone()).catch(() => {});
        }
        return res;
      } catch {
        const cached = isNavigate ? await cache.match('/index.html') : await cache.match(req);
        return cached || Response.error();
      }
    })());
    return;
  }

  // Copie locale d'abord pour les icônes, le manifest et les images de /assets/.
  const isLocalImage = url.pathname.startsWith('/assets/');
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
  // Apple exige qu'une notification soit toujours affichée : titre par défaut si vide.
  let data = { title: "Pro'Vap Sevrage", body: '' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: "Pro'Vap Sevrage", body: event.data.text() };
    }
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
  const target = new URL(event.notification.data?.url || '/', self.location.origin);

  event.waitUntil(
    (async () => {
      // Lien vers un autre site : on l'ouvre tel quel
      if (target.origin !== self.location.origin) {
        return self.clients.openWindow ? self.clients.openWindow(target.href) : undefined;
      }
      // App déjà ouverte : on la ramène devant, sur la bonne page
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const win = all.find(c => new URL(c.url).origin === target.origin);
      if (win) {
        await win.focus();
        if ('navigate' in win && new URL(win.url).pathname !== target.pathname) {
          try { await win.navigate(target.href); } catch { /* reste sur la page actuelle */ }
        }
        return;
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(target.href);
      }
    })()
  );
});
