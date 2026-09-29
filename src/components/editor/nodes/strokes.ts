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

const cache = new WeakMap<Stroke[], HTMLCanvasElement>()

/** Rasteriza la capa en un canvas propio: así el borrador sólo borra esta capa. */
export function rasterizeDrawing(el: DrawingElement): HTMLCanvasElement {
  const hit = cache.get(el.strokes)
  if (hit && hit.dataset.w === String(el.baseWidth) && hit.dataset.h === String(el.baseHeight)) return hit
  const scale = Math.min(2, 4096 / Math.max(el.baseWidth, el.baseHeight))
  const c = document.createElement('canvas')
  c.width = Math.ceil(el.baseWidth * scale)
  c.height = Math.ceil(el.baseHeight * scale)
  c.dataset.w = String(el.baseWidth)
  c.dataset.h = String(el.baseHeight)
  const ctx = c.getContext('2d')!
  ctx.scale(scale, scale)
  for (const s of el.strokes) paintStroke(ctx, s)
  cache.set(el.strokes, c)
  return c
}
