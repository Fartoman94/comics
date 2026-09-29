// Miniaturas de páginas en memoria: se regeneran cuando cambia el objeto de la página.
const thumbStore = new Map<string, { src: string; key: object }>()
const listeners = new Set<() => void>()

export function subscribeThumbs(cb: () => void) {
  listeners.add(cb)
  return () => void listeners.delete(cb)
}
export const getThumb = (pageId: string) => thumbStore.get(pageId)?.src
export const thumbIsFresh = (pageId: string, key: object) => thumbStore.get(pageId)?.key === key
export function setThumb(pageId: string, src: string, key: object) {
  thumbStore.set(pageId, { src, key })
  listeners.forEach((l) => l())
}
