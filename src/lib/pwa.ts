// PWA Service Worker Registration & Lifecycle Helper

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  // Only in production builds — real sites don't run the SW on localhost/dev,
  // where it would intercept Vite HMR and show extra fetches in DevTools.
  if (!import.meta.env.PROD) {
    // Clean up any SW left over from before this guard existed.
    // Otherwise the stale worker keeps intercepting dev requests
    // (gear icon + duplicate fetch rows) until manually unregistered.
    navigator.serviceWorker.getRegistrations?.().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister()
      }
    })
    return
  }

  // Register service worker on window load
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Check for updates periodically or when page becomes visible
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing
          if (!installingWorker) return

          installingWorker.addEventListener('statechange', () => {
            if (
              installingWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New content is available; inform user or handle auto update
              console.log('[PWA] New version available! Reloading or applying update...')
            }
          })
        })
      })
      .catch((error) => {
        console.warn('[PWA] Service worker registration failed:', error)
      })
  })
}
