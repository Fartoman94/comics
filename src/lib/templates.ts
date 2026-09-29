import type { PageFormat, PanelElement } from '../types'
import { bbox, insetConvexPolygon, type Pt } from './geometry'
import { createPanel } from './factories'

export interface PanelTemplate {
  id: string
  name: string
  group: 'Clásicos' | 'Manga' | 'Dinámicos' | 'Webtoon / tiras'
  /** Polígonos convexos en coordenadas normalizadas del área útil (0..1). */
  polys: Pt[][]
}

type Row = { h: number; cols: number[] }

function grid(rows: Row[]): Pt[][] {
  const totalH = rows.reduce((s, r) => s + r.h, 0)
  const out: Pt[][] = []
  let y = 0
  for (const row of rows) {
    const h = row.h / totalH
    const totalW = row.cols.reduce((s, c) => s + c, 0)
    let x = 0
    for (const c of row.cols) {
      const w = c / totalW
      out.push(rect(x, y, w, h))
      x += w
    }
    y += h
  }
  return out
}

function rect(x: number, y: number, w: number, h: number): Pt[] {
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ]
}

const q = (...c: number[]): Pt[] => {
  const pts: Pt[] = []
  for (let i = 0; i < c.length; i += 2) pts.push({ x: c[i], y: c[i + 1] })
  return pts
}

export const TEMPLATES: PanelTemplate[] = [
  { id: 'splash', name: 'Splash (1)', group: 'Clásicos', polys: grid([{ h: 1, cols: [1] }]) },
  { id: 'two-rows', name: '2 filas', group: 'Clásicos', polys: grid([{ h: 1, cols: [1] }, { h: 1, cols: [1] }]) },
  { id: 'three-rows', name: '3 filas', group: 'Clásicos', polys: grid([{ h: 1, cols: [1] }, { h: 1, cols: [1] }, { h: 1, cols: [1] }]) },
  { id: 'grid-2x2', name: 'Cuadrícula 4', group: 'Clásicos', polys: grid([{ h: 1, cols: [1, 1] }, { h: 1, cols: [1, 1] }]) },
  { id: 'classic-6', name: 'Clásica 6', group: 'Clásicos', polys: grid([{ h: 1, cols: [1, 1] }, { h: 1, cols: [1, 1] }, { h: 1, cols: [1, 1] }]) },
  { id: 'grid-9', name: 'Watchmen 9', group: 'Clásicos', polys: grid([{ h: 1, cols: [1, 1, 1] }, { h: 1, cols: [1, 1, 1] }, { h: 1, cols: [1, 1, 1] }]) },
  { id: 'hero-top', name: 'Destacada arriba', group: 'Clásicos', polys: grid([{ h: 1.6, cols: [1] }, { h: 1, cols: [1, 1, 1] }]) },
  { id: 'hero-mid', name: 'Destacada al medio', group: 'Clásicos', polys: grid([{ h: 1, cols: [1, 1] }, { h: 1.5, cols: [1] }, { h: 1, cols: [1.4, 1] }]) },
  { id: 'mixed-5', name: 'Mixta 5', group: 'Clásicos', polys: grid([{ h: 1, cols: [2, 1] }, { h: 1, cols: [1] }, { h: 1, cols: [1, 2] }]) },
  {
    id: 'manga-dynamic',
    name: 'Manga dinámico',
    group: 'Manga',
    polys: [
      q(0, 0, 1, 0, 1, 0.3, 0, 0.36),
      q(0.42, 0.36, 1, 0.3, 1, 0.66, 0.36, 0.66),
      q(0, 0.36, 0.42, 0.36, 0.36, 0.66, 0, 0.66),
      q(0, 0.66, 0.62, 0.66, 0.56, 1, 0, 1),
      q(0.62, 0.66, 1, 0.66, 1, 1, 0.56, 1),
    ],
  },
  {
    id: 'manga-vertical',
    name: 'Manga vertical',
    group: 'Manga',
    polys: [
      q(0, 0, 1, 0, 1, 0.25, 0, 0.25),
      q(0.55, 0.25, 1, 0.25, 1, 1, 0.5, 1),
      q(0, 0.25, 0.55, 0.25, 0.5, 0.62, 0, 0.62),
      q(0, 0.62, 0.5, 0.62, 0.5, 1, 0, 1),
    ],
  },
  {
    id: 'manga-action',
    name: 'Acción diagonal',
    group: 'Manga',
    polys: [
      q(0, 0, 1, 0, 1, 0.2, 0, 0.28),
      q(0, 0.28, 1, 0.2, 1, 0.58, 0, 0.7),
      q(0, 0.7, 0.45, 0.645, 0.4, 1, 0, 1),
      q(0.45, 0.645, 1, 0.58, 1, 1, 0.4, 1),
    ],
  },
  {
    id: 'manga-4koma',
    name: 'Yonkoma (4-koma)',
    group: 'Manga',
    polys: [rect(0.2, 0, 0.6, 0.25), rect(0.2, 0.25, 0.6, 0.25), rect(0.2, 0.5, 0.6, 0.25), rect(0.2, 0.75, 0.6, 0.25)],
  },
  {
    id: 'shards',
    name: 'Fragmentos',
    group: 'Dinámicos',
    polys: [
      q(0, 0, 0.6, 0, 0.45, 0.45, 0, 0.5),
      q(0.6, 0, 1, 0, 1, 0.4, 0.45, 0.45),
      q(0, 0.5, 0.45, 0.45, 0.55, 1, 0, 1),
      q(0.45, 0.45, 1, 0.4, 1, 1, 0.55, 1),
    ],
  },
  {
    id: 'zigzag',
    name: 'Zigzag',
    group: 'Dinámicos',
    polys: [
      q(0, 0, 1, 0, 1, 0.22, 0, 0.3),
      q(0, 0.3, 1, 0.22, 1, 0.5, 0, 0.42),
      q(0, 0.42, 1, 0.5, 1, 0.72, 0, 0.8),
      q(0, 0.8, 1, 0.72, 1, 1, 0, 1),
    ],
  },
  {
    id: 'webtoon-stack',
    name: 'Webtoon 3',
    group: 'Webtoon / tiras',
    polys: [rect(0, 0, 1, 0.28), rect(0, 0.36, 1, 0.3), rect(0, 0.74, 1, 0.26)],
  },
  { id: 'strip-3', name: 'Tira 3', group: 'Webtoon / tiras', polys: grid([{ h: 1, cols: [1, 1, 1] }]) },
  { id: 'strip-4', name: 'Tira 4', group: 'Webtoon / tiras', polys: grid([{ h: 1, cols: [1, 1, 1, 1] }]) },
]

/** Convierte una plantilla en viñetas reales con margen y medianil (gutter) en px. */
export function buildTemplatePanels(tpl: PanelTemplate, format: PageFormat, margin: number, gutter: number): PanelElement[] {
  const half = gutter / 2
  // El área se expande medio medianil para que el margen exterior quede exacto tras contraer.
  const ox = margin - half
  const oy = margin - half
  const w = format.width - ox * 2
  const h = format.height - oy * 2
  return tpl.polys.map((poly, i) => {
    const abs = poly.map((p) => ({ x: ox + p.x * w, y: oy + p.y * h }))
    const inset = insetConvexPolygon(abs, half)
    const b = bbox(inset)
    const isRect =
      inset.length === 4 &&
      inset.every((p) => (Math.abs(p.x - b.x) < 0.5 || Math.abs(p.x - b.x - b.width) < 0.5) && (Math.abs(p.y - b.y) < 0.5 || Math.abs(p.y - b.y - b.height) < 0.5))
    const pts = isRect ? null : inset.flatMap((p) => [(p.x - b.x) / b.width, (p.y - b.y) / b.height])
    const panel = createPanel(Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height), pts)
    panel.name = `Viñeta ${i + 1}`
    return panel
  })
}
