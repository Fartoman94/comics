import type { Asset, PanelElement, PanelImage } from '../types'
import { DEFAULT_FILTERS } from '../types'
import { bbox, type Pt } from './geometry'
import { cloneElement } from './factories'

/** Polígono absoluto (coordenadas de página) de una viñeta, rectangular o no. */
export function panelPolygon(p: Pick<PanelElement, 'x' | 'y' | 'width' | 'height' | 'points'>): Pt[] {
  if (!p.points) {
    return [
      { x: p.x, y: p.y },
      { x: p.x + p.width, y: p.y },
      { x: p.x + p.width, y: p.y + p.height },
      { x: p.x, y: p.y + p.height },
    ]
  }
  const out: Pt[] = []
  for (let i = 0; i < p.points.length; i += 2) out.push({ x: p.x + p.points[i] * p.width, y: p.y + p.points[i + 1] * p.height })
  return out
}

/**
 * Recorta un polígono convexo con el semiplano a·x + b·y <= c (Sutherland–Hodgman).
 * Con polígonos convexos el resultado sigue siendo convexo: se puede volver a dividir.
 */
export function clipHalfPlane(poly: Pt[], a: number, b: number, c: number): Pt[] {
  const out: Pt[] = []
  const inside = (p: Pt) => a * p.x + b * p.y <= c + 1e-7
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i]
    const prev = poly[(i + poly.length - 1) % poly.length]
    const ci = inside(cur)
    const pi = inside(prev)
    if (ci !== pi) {
      const den = a * (cur.x - prev.x) + b * (cur.y - prev.y)
      const t = den === 0 ? 0 : (c - a * prev.x - b * prev.y) / den
      out.push({ x: prev.x + (cur.x - prev.x) * t, y: prev.y + (cur.y - prev.y) * t })
    }
    if (ci) out.push(cur)
  }
  // Puntos repetidos (cortes justo sobre un vértice) se quitan.
  return out.filter((p, i) => {
    const q = out[(i + out.length - 1) % out.length]
    return out.length < 2 || Math.hypot(p.x - q.x, p.y - q.y) > 0.01
  })
}

/** Geometría (bounding box + puntos normalizados) para un polígono absoluto. Null si es rectángulo alineado. */
export function geometryFromPolygon(poly: Pt[]): { x: number; y: number; width: number; height: number; points: number[] | null } {
  const b = bbox(poly)
  const isRect =
    poly.length === 4 &&
    poly.every((p) => (Math.abs(p.x - b.x) < 0.5 || Math.abs(p.x - b.x - b.width) < 0.5) && (Math.abs(p.y - b.y) < 0.5 || Math.abs(p.y - b.y - b.height) < 0.5))
  const points = isRect ? null : poly.flatMap((p) => [(p.x - b.x) / (b.width || 1), (p.y - b.y) / (b.height || 1)])
  return { x: Math.round(b.x), y: Math.round(b.y), width: Math.round(b.width), height: Math.round(b.height), points }
}

export type SplitDirection = 'horizontal' | 'vertical' | 'diagonal'

/**
 * Divide una viñeta en dos con un medianil (gutter) entre ambas.
 * - horizontal: una arriba y otra abajo.
 * - vertical: una a la izquierda y otra a la derecha.
 * - diagonal: corte inclinado (de arriba a la derecha hacia abajo a la izquierda).
 * La primera conserva la imagen, el id y el estilo; la segunda es una copia sin imagen.
 * Devuelve null si alguna mitad quedaría demasiado chica.
 */
export function splitPanel(panel: PanelElement, dir: SplitDirection, gutter: number): [PanelElement, PanelElement] | null {
  const poly = panelPolygon(panel)
  const b = bbox(poly)
  const cx = b.x + b.width / 2
  const cy = b.y + b.height / 2
  const g = Math.max(0, gutter) / 2
  let n: { a: number; b: number }
  if (dir === 'horizontal') n = { a: 0, b: 1 }
  else if (dir === 'vertical') n = { a: 1, b: 0 }
  else {
    // Normal de la recta que va de (x+w*0.6, y) a (x+w*0.4, y+h): inclinación suave y estable.
    const dx = -b.width * 0.2
    const dy = b.height
    const len = Math.hypot(dx, dy) || 1
    n = { a: dy / len, b: -dx / len }
  }
  const c = n.a * cx + n.b * cy
  const first = clipHalfPlane(poly, n.a, n.b, c - g)
  const second = clipHalfPlane(poly, -n.a, -n.b, -(c + g))
  if (first.length < 3 || second.length < 3) return null
  const g1 = geometryFromPolygon(first)
  const g2 = geometryFromPolygon(second)
  if (g1.width < 24 || g1.height < 24 || g2.width < 24 || g2.height < 24) return null
  const a: PanelElement = { ...panel, ...g1, image: panel.image ? fitPanelImageAfterResize(panel, g1) : null }
  const copy = cloneElement(panel, 0) as PanelElement
  const bPanel: PanelElement = { ...copy, ...g2, image: null, name: nextPanelName(panel.name) }
  return [a, bPanel]
}

/** Si la viñeta se achica, la imagen se corre para que el mismo punto siga a la vista. */
function fitPanelImageAfterResize(panel: PanelElement, g: { x: number; y: number }): PanelImage | null {
  if (!panel.image) return null
  return { ...panel.image, x: panel.image.x + (panel.x - g.x), y: panel.image.y + (panel.y - g.y) }
}

function nextPanelName(name: string) {
  const m = /^(.*?)(\d+)$/.exec(name)
  return m ? `${m[1]}${Number(m[2])}b` : `${name} (b)`
}

export type PanelShape = 'rect' | 'rounded' | 'slant-right' | 'slant-left' | 'trapezoid'

export const PANEL_SHAPES: { id: PanelShape; label: string }[] = [
  { id: 'rect', label: 'Recta' },
  { id: 'rounded', label: 'Redondeada' },
  { id: 'slant-right', label: 'Diagonal ↗' },
  { id: 'slant-left', label: 'Diagonal ↖' },
  { id: 'trapezoid', label: 'Trapecio' },
]

/** Puntos normalizados y radio para una forma predefinida (dentro del mismo bounding box). */
export function shapeGeometry(shape: PanelShape, width: number): { points: number[] | null; cornerRadius: number } {
  const k = 0.12
  switch (shape) {
    case 'rect':
      return { points: null, cornerRadius: 0 }
    case 'rounded':
      return { points: null, cornerRadius: Math.max(12, Math.round(width * 0.04)) }
    case 'slant-right':
      return { points: [0, k, 1, 0, 1, 1, 0, 1], cornerRadius: 0 }
    case 'slant-left':
      return { points: [0, 0, 1, k, 1, 1, 0, 1], cornerRadius: 0 }
    case 'trapezoid':
      return { points: [k, 0, 1 - k, 0, 1, 1, 0, 1], cornerRadius: 0 }
  }
}

/** Qué forma predefinida describe la viñeta (o null si es un polígono propio). */
export function detectShape(p: Pick<PanelElement, 'points' | 'cornerRadius'>): PanelShape | null {
  if (!p.points) return p.cornerRadius > 0 ? 'rounded' : 'rect'
  const same = (a: number[]) => a.length === p.points!.length && a.every((v, i) => Math.abs(v - p.points![i]) < 1e-3)
  for (const s of ['slant-right', 'slant-left', 'trapezoid'] as const) if (same(shapeGeometry(s, 100).points!)) return s
  return null
}

export type ImageFit = 'cover' | 'contain'

/** Imagen de viñeta encajada: 'cover' llena el marco (recorta lo que sobra), 'contain' la muestra entera. */
export function fitPanelImage(panel: Pick<PanelElement, 'width' | 'height'>, asset: Pick<Asset, 'width' | 'height'>, fit: ImageFit, prev?: PanelImage | null): PanelImage {
  const sx = panel.width / asset.width
  const sy = panel.height / asset.height
  const scale = fit === 'cover' ? Math.max(sx, sy) : Math.min(sx, sy)
  return {
    assetId: prev?.assetId ?? '',
    x: (panel.width - asset.width * scale) / 2,
    y: (panel.height - asset.height * scale) / 2,
    scale,
    filters: prev?.filters ? { ...prev.filters } : { ...DEFAULT_FILTERS },
  }
}

/** Recorte (en px de la imagen original) que llena una caja w×h sin deformar: "Rellenar" para imágenes libres. */
export function coverCrop(asset: Pick<Asset, 'width' | 'height'>, w: number, h: number) {
  const target = w / h
  const ratio = asset.width / asset.height
  if (ratio > target) {
    const cw = asset.height * target
    return { x: (asset.width - cw) / 2, y: 0, width: cw, height: asset.height }
  }
  const ch = asset.width / target
  return { x: 0, y: (asset.height - ch) / 2, width: asset.width, height: ch }
}
