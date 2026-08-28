const CACHE = 'request-sheet-v2';
const SHELL = [
  '/',
  '/favicon.svg',
  '/manifest.webmanifest',
  '/assets/request-docket-hero-960.avif',
  '/assets/request-docket-hero-960.webp',
  '/assets/request-docket-hero-960.jpg',
  '/assets/request-docket-hero-1536.avif',
  '/assets/request-docket-hero-1536.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    const documentResponse = await cache.match('/');
    const html = await documentResponse.text();
    const buildAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+\.(?:js|css))"/g)].map((match) => match[1]);
    await cache.addAll(buildAssets);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(caches.match(event.request).then((cached) => {
    const fresh = fetch(event.request).then((response) => {
      if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => cached || caches.match('/'));
    return cached || fresh;
  }));
});
