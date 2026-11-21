const VERSION = 'v1'
const CACHE = `inventario-${VERSION}`

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key.startsWith('inventario-') && key !== CACHE)
          .map((key) => caches.delete(key)),
      )
      await self.clients.claim()
    })(),
  )
})

function indexUrl() {
  return new URL('index.html', self.registration.scope).href
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request)
          if (response.ok) {
            const cache = await caches.open(CACHE)
            await cache.put(indexUrl(), response.clone())
          }
          return response
        } catch {
          const cache = await caches.open(CACHE)
          const cached = await cache.match(indexUrl())
          return cached || Response.error()
        }
      })(),
    )
    return
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const cached = await cache.match(request)
      if (cached) return cached

      const response = await fetch(request)
      if (response.ok) await cache.put(request, response.clone())
      return response
    })(),
  )
})
