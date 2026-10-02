import { lazy, type ComponentType } from 'react'
import { useEditor } from '../store/editor'

const KEY = 'vineta:recarga-por-version'

/**
 * Si después de un deploy un chunk viejo ya no existe, en vez de una pantalla en blanco se guarda
 * lo pendiente y se recarga una vez para tomar la versión nueva.
 */
export async function reloadForNewVersion() {
  try {
    if (sessionStorage.getItem(KEY) && Date.now() - Number(sessionStorage.getItem(KEY)) < 30_000) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    /* sin almacenamiento: se recarga igual */
  }
  await useEditor.getState().saveNow().catch(() => undefined)
  location.reload()
  return true
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithReload<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await factory()
    } catch (e) {
      if (await reloadForNewVersion()) return new Promise<never>(() => undefined)
      throw e
    }
  })
}
