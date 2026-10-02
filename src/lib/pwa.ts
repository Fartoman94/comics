import { useEditor } from '../store/editor'

declare const __BUILD_ID__: string

/**
 * Registra el service worker (sólo en producción). Cuando hay una versión nueva no recarga sola:
 * avisa, y al aceptar guarda lo pendiente, activa la versión nueva y recarga.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register(`/sw.js?v=${__BUILD_ID__}`)
      const offer = (w: ServiceWorker) =>
        useEditor.getState().toast('Hay una versión nueva de Viñeta Studio.', 'info', {
          label: 'Actualizar',
          run: async () => {
            await useEditor.getState().saveNow()
            w.postMessage('SKIP_WAITING')
          },
        })
      if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting)
      reg.addEventListener('updatefound', () => {
        const w = reg.installing
        w?.addEventListener('statechange', () => w.state === 'installed' && navigator.serviceWorker.controller && offer(w))
      })
      let reloading = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) return
        reloading = true
        location.reload()
      })
      // Buscar versiones nuevas de vez en cuando y al volver a la pestaña.
      setInterval(() => void reg.update().catch(() => undefined), 30 * 60_000)
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && void reg.update().catch(() => undefined))
      // Dejar listo el editor para usarlo sin conexión.
      const idle = (cb: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(cb) : setTimeout(cb, 2000))
      idle(() => void import('../components/editor/Editor').catch(() => undefined))
    } catch (e) {
      console.warn('[sw]', e)
    }
  })
}
