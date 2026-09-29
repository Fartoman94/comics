import { useSyncExternalStore } from 'react'
import { getAssetBlob } from './storage'

// Cache global de HTMLImageElement por asset: Konva necesita imágenes decodificadas.
const images = new Map<string, HTMLImageElement>()
const urls = new Map<string, string>()
const pending = new Map<string, Promise<HTMLImageElement | null>>()
const listeners = new Set<() => void>()
let version = 0

function notify() {
  version++
  listeners.forEach((l) => l())
}

export function loadAssetImage(id: string): Promise<HTMLImageElement | null> {
  const cached = images.get(id)
  if (cached) return Promise.resolve(cached)
  let p = pending.get(id)
  if (!p) {
    p = (async () => {
      const blob = await getAssetBlob(id)
      if (!blob) return null
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.src = url
      await img.decode().catch(() => undefined)
      images.set(id, img)
      urls.set(id, url)
      notify()
      return img
    })()
    pending.set(id, p)
  }
  return p
}

export function getAssetUrl(id: string) {
  return urls.get(id)
}

export function preloadAssets(ids: string[]) {
  return Promise.all(ids.map(loadAssetImage))
}

export function useAssetImage(id: string | undefined | null): HTMLImageElement | undefined {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => version,
  )
  if (!id) return undefined
  const img = images.get(id)
  if (!img) void loadAssetImage(id)
  return img
}

export function forgetAsset(id: string) {
  const url = urls.get(id)
  if (url) URL.revokeObjectURL(url)
  images.delete(id)
  urls.delete(id)
  pending.delete(id)
  notify()
}
