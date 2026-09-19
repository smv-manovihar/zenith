// Zenith PWA Service Worker
const CACHE_VERSION = '1.1.0'
const CACHE_NAME = `zenith-cache-v${CACHE_VERSION}`

// Core static assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/manifest.json',
  '/favicon.svg',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/maskable-icon-512x512.png',
  '/og-image.png'
]

// Install Event - Pre-cache critical app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching partial failure:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('zenith-cache-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch Event - cache-first for immutable assets, network-first for navigations.
// No background revalidation: a cache hit does NOT trigger a network fetch.
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests and external API calls (AniList GraphQL, OAuth, Vercel analytics)
  if (
    request.method !== 'GET' ||
    request.url.includes('graphql.anilist.co') ||
    request.url.includes('anilist.co/api') ||
    request.url.includes('/_vercel/')
  ) {
    return
  }

  const url = new URL(request.url)

  // Let cross-origin requests (CDN images, fonts, etc.) pass through untouched.
  // Only handle same-origin requests.
  if (url.origin !== self.location.origin) {
    return
  }

  // Never intercept Vite dev / HMR requests, even if a stale worker lingers.
  // These must always hit the dev server directly.
  if (
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.includes('@vite') ||
    url.pathname.includes('@react-refresh') ||
    url.pathname.includes('__vite') ||
    url.searchParams.has('t') ||
    url.searchParams.has('v') ||
    url.searchParams.has('import')
  ) {
    return
  }

  // Navigation requests (e.g. /sync via BrowserRouter): network-only with
  // offline fallback. Deliberately NOT cached per-route — caching every SPA
  // route (/sync, /import, ...) as separate entries is what real sites avoid,
  // and cache.put() here is what surfaces as duplicate fetch rows in DevTools.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html').then((cached) => cached || caches.match('/'))
      })
    )
    return
  }

  // All other same-origin GETs: only handle cacheable static files
  // (hashed /assets/*, icons, manifest, precached shell).
  // Anything else (SPA routes fetched via fetch(), API-like GETs) bypasses
  // the worker entirely so it never shows up as an extra fetch/XHR row.
  const isStaticFile =
    url.pathname.startsWith('/assets/') ||
    PRECACHE_ASSETS.includes(url.pathname) ||
    /\.[a-z0-9]+$/i.test(url.pathname)
  if (!isStaticFile) {
    return
  }

  // Cache-first. Serve from cache if present, fetch + cache only on miss.
  // A cache hit produces ZERO network requests (no background revalidation).
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return networkResponse
      })
    })
  )
})

// Listen for messages from client (e.g. skip waiting command)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
