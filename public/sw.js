// Zenith PWA Service Worker
const CACHE_VERSION = 'zenith-v1.0.0'
const CACHE_NAME = `zenith-cache-${CACHE_VERSION}`

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

// Fetch Event - Network first with cache fallback for navigation, cache-first for hashed assets
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

  // Navigation requests: Network-first to always get latest index.html, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => {
          return caches.match(request).then((cached) => cached || caches.match('/'))
        })
    )
    return
  }

  // Static Assets (JS, CSS, Images, Fonts): Stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return networkResponse
        })
        .catch(() => cachedResponse)

      return cachedResponse || fetchPromise
    })
  )
})

// Listen for messages from client (e.g. skip waiting command)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
