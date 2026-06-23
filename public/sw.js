const CACHE = 'budgetos-v1'
const SHELL = ['/', '/dashboard', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ))
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(request).catch(() => caches.match(request)))
    return
  }

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    e.respondWith(
      caches.match(request).then(cached => cached ?? fetch(request).then(res => {
        const clone = res.clone()
        caches.open(CACHE).then(c => c.put(request, clone))
        return res
      }))
    )
    return
  }

  e.respondWith(
    fetch(request).then(res => {
      const clone = res.clone()
      caches.open(CACHE).then(c => c.put(request, clone))
      return res
    }).catch(() => caches.match(request) ?? caches.match('/'))
  )
})
