// PWA Service Worker Registration & Lifecycle Helper

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
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
