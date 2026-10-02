import { getStroke } from 'perfect-freehand'
import type { BrushKind, DrawingElement, Stroke } from '../../../types'

const BRUSH_OPTIONS: Record<BrushKind, { thinning: number; smoothing: number; streamline: number; taper: boolean }> = {
  pen: { thinning: 0.45, smoothing: 0.55, streamline: 0.45, taper: false },
  ink: { thinning: 0.72, smoothing: 0.62, streamline: 0.5, taper: true },
  pencil: { thinning: 0.2, smoothing: 0.4, streamline: 0.3, taper: false },
  marker: { thinning: 0, smoothing: 0.6, streamline: 0.5, taper: false },
}

export function strokeOutline(s: Stroke, simulatePressure: boolean): number[][] {
  const o = BRUSH_OPTIONS[s.brush]
  return getStroke(s.points, {
    size: s.size,
    thinning: s.erase ? 0 : o.thinning,
    smoothing: o.smoothing,
    streamline: o.streamline,
    simulatePressure,
    start: { taper: o.taper ? s.size * 3 : 0, cap: true },
    end: { taper: o.taper ? s.size * 4 : 0, cap: true },
    last: true,
  })
}

export function traceOutline(ctx: CanvasRenderingContext2D, outline: number[][]) {
  if (outline.length < 2) return
  ctx.beginPath()
  ctx.moveTo(outline[0][0], outline[0][1])
  for (let i = 1; i < outline.length; i++) {
    const [x0, y0] = outline[i]
    const [x1, y1] = outline[(i + 1) % outline.length]
    ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
  }
  ctx.closePath()
}

export function paintStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
  // Si todos los puntos traen presión 0.5 exacta es mouse: se simula la presión por velocidad.
  const simulate = s.points.every((p) => p[2] === 0.5)
  ctx.save()
  ctx.globalAlpha = s.erase ? 1 : s.opacity * (s.brush === 'pencil' ? 0.85 : 1)
  ctx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over'
  ctx.fillStyle = s.color
  traceOutline(ctx, strokeOutline(s, simulate))
  ctx.fill()
  ctx.restore()
}

// Un canvas por capa de dibujo (por id), no por versión de la lista de trazos: el historial de
// deshacer guarda muchas versiones y antes cada una retenía su propio canvas gigante.
interface CacheEntry {
  strokes: Stroke[]
  canvas: HTMLCanvasElement
  scale: number
}
const cache = new Map<string, CacheEntry>()
const MAX_LAYERS = 24

function paintAll(ctx: CanvasRenderingContext2D, scale: number, strokes: Stroke[], from = 0) {
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  for (let i = from; i < strokes.length; i++) paintStroke(ctx, strokes[i])
}

/** Rasteriza la capa en un canvas propio: así el borrador sólo borra esta capa. */
export function rasterizeDrawing(el: DrawingElement): HTMLCanvasElement {
  const scale = Math.min(2, 4096 / Math.max(el.baseWidth, el.baseHeight))
  const w = Math.ceil(el.baseWidth * scale)
  const h = Math.ceil(el.baseHeight * scale)
  const hit = cache.get(el.id)
  if (hit && hit.canvas.width === w && hit.canvas.height === h) {
    if (hit.strokes === el.strokes) return hit.canvas
    const ctx = hit.canvas.getContext('2d')!
    // Trazo nuevo al final: se pinta sólo lo que falta. Deshacer u otro cambio: se repinta entero.
    const prefix = hit.strokes.length <= el.strokes.length && hit.strokes.every((st, i) => st === el.strokes[i])
    if (!prefix) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, w, h)
    }
    paintAll(ctx, scale, el.strokes, prefix ? hit.strokes.length : 0)
    hit.strokes = el.strokes
    cache.delete(el.id)
    cache.set(el.id, hit)
    return hit.canvas
  }
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  paintAll(c.getContext('2d')!, scale, el.strokes)
  cache.delete(el.id)
  cache.set(el.id, { strokes: el.strokes, canvas: c, scale })
  // Acotado: se liberan las capas usadas hace más tiempo.
  while (cache.size > MAX_LAYERS) {
    const oldest = cache.keys().next().value!
    const entry = cache.get(oldest)!
    entry.canvas.width = entry.canvas.height = 0
    cache.delete(oldest)
  }
  return c
}

/** Para tests y diagnóstico: cuántos canvases de dibujo hay retenidos. */
export function strokeCacheSize() {
  return cache.size
}
