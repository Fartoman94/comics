// Service worker de Viñeta Studio: abrir la app y los proyectos locales sin conexión.
// - Navegación: primero la red (siempre la versión nueva si hay internet); sin red, el shell guardado.
// - /assets/* (con hash, inmutables): de la caché si están; sólo se guardan respuestas correctas,
//   nunca un 404, así un deploy nuevo no deja chunks rotos guardados para siempre.
// - No se activa solo: la app avisa que hay versión nueva y recarga después de guardar.
const VERSION = new URL(self.location).searchParams.get('v') || 'dev'
const CACHE = `vineta-${VERSION}`
const FONTS = 'vineta-fuentes'
const SHELL = ['/', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png']

self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL))))

self.addEventListener('activate', (e) =>
  e.waitUntil(
    (async () => {
      for (const k of await caches.keys()) if (k.startsWith('vineta-') && k !== CACHE && k !== FONTS) await caches.delete(k)
      await self.clients.claim()
    })(),
  ),
)

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting()
})

const put = async (cacheName, req, res) => {
  if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) await (await caches.open(cacheName)).put(req, res.clone())
  return res
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => put(CACHE, '/', res))
        .catch(async () => (await caches.match('/', { cacheName: CACHE })) ?? Response.error()),
    )
    return
  }
  if (url.origin === location.origin) {
    if (url.pathname.startsWith('/assets/')) {
      e.respondWith(caches.match(req).then((hit) => hit ?? fetch(req).then((res) => put(CACHE, req, res))))
    } else if (!url.pathname.startsWith('/sw.js')) {
      // Íconos, imágenes del ejemplo, logo: de la caché si está y se actualiza por detrás.
      e.respondWith(
        caches.match(req).then((hit) => {
          const net = fetch(req)
            .then((res) => put(CACHE, req, res))
            .catch(() => hit)
          return hit ?? net
        }),
      )
    }
    return
  }
  if (url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then((hit) => hit ?? fetch(req).then((res) => put(FONTS, req, res))))
  }
})
