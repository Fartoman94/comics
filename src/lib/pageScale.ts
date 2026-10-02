import type { ComicElement, Page, PageFormat } from '../types'

/** Escala una página guardada en otro formato al formato actual (posiciones, tamaños y texto). */
export function scalePage(page: Page, from: Pick<PageFormat, 'width' | 'height'>, to: Pick<PageFormat, 'width' | 'height'>): Page {
  const sx = to.width / from.width
  const sy = to.height / from.height
  if (sx === 1 && sy === 1) return structuredClone(page)
  const k = Math.min(sx, sy)
  const elements = page.elements.map((src): ComicElement => {
    const e = structuredClone(src)
    e.x *= sx
    e.y *= sy
    e.width *= sx
    e.height *= sy
    if (e.type === 'text' || e.type === 'bubble') {
      e.fontSize = Math.max(6, Math.round(e.fontSize * k))
      e.strokeWidth *= k
    }
    if (e.type === 'bubble') {
      e.tailX *= sx
      e.tailY *= sy
      e.padding *= k
    }
    if (e.type === 'panel') {
      e.strokeWidth *= k
      if (e.image) e.image = { ...e.image, x: e.image.x * sx, y: e.image.y * sy, scale: e.image.scale * Math.max(sx, sy) }
    }
    return e
  })
  return { ...page, elements }
}
