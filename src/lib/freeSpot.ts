import type { ComicElement, Page } from '../types'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

const overlaps = (a: Rect, b: Rect, pad: number) => a.x < b.x + b.width + pad && a.x + a.width + pad > b.x && a.y < b.y + b.height + pad && a.y + a.height + pad > b.y

/** Lo que estorba a un globo o texto nuevo: otros globos, textos e imágenes libres visibles. */
const obstacles = (page: Page) => page.elements.filter((e: ComicElement) => !e.hidden && (e.type === 'bubble' || e.type === 'text' || e.type === 'image'))

/**
 * Busca un lugar libre de w×h dentro de `area` (la viñeta activa o lo visible de la página),
 * empezando por el centro. Si no hay, se corre en diagonal de a poco sin salirse del área.
 */
export function findFreeSpot(w: number, h: number, page: Page, area: Rect, pad = 8): { x: number; y: number } {
  const obs = obstacles(page)
  const cx = area.x + area.width / 2 - w / 2
  const cy = area.y + area.height / 2 - h / 2
  const maxX = area.x + Math.max(0, area.width - w)
  const maxY = area.y + Math.max(0, area.height - h)
  const clamp = (x: number, y: number) => ({ x: Math.round(Math.min(maxX, Math.max(area.x, x))), y: Math.round(Math.min(maxY, Math.max(area.y, y))) })
  const step = Math.max(12, Math.min(w, h) / 3)
  const candidates: { x: number; y: number; d: number }[] = []
  for (let y = area.y; y <= maxY + 0.5; y += step)
    for (let x = area.x; x <= maxX + 0.5; x += step) candidates.push({ x, y, d: Math.hypot(x - cx, y - cy) })
  candidates.sort((a, b) => a.d - b.d)
  for (const c of candidates) {
    const r = { x: c.x, y: c.y, width: w, height: h }
    if (!obs.some((o) => overlaps(r, o, pad))) return clamp(c.x, c.y)
  }
  // Todo ocupado: se corre según cuántos objetos ya hay, siempre dentro del área visible.
  const k = obs.length % 8
  return clamp(cx + k * step * 0.6, cy + k * step * 0.6)
}

/** Intersección de dos rectángulos (o el segundo si no se tocan). */
export function intersect(a: Rect, b: Rect): Rect {
  const x = Math.max(a.x, b.x)
  const y = Math.max(a.y, b.y)
  const r = Math.min(a.x + a.width, b.x + b.width)
  const btm = Math.min(a.y + a.height, b.y + b.height)
  return r > x && btm > y ? { x, y, width: r - x, height: btm - y } : b
}
