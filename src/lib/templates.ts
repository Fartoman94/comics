import type { PageFormat, PanelElement } from '../types'
import { bbox, insetConvexPolygon, type Pt } from './geometry'
import { createPanel } from './factories'

export type TemplateCategory = 'portada' | 'accion' | 'dialogo' | 'tira' | 'yonkoma' | 'splash' | 'webtoon' | 'storyboard'
export type TemplateStyle = 'occidental' | 'manga' | 'neutral'
/** Para qué formato de página está pensada: vertical (página), horizontal (tira) o tira larga (webtoon). */
export type TemplateShape = 'vertical' | 'horizontal' | 'larga'

export interface PanelTemplate {
  id: string
  name: string
  group: 'Clásicos' | 'Manga' | 'Dinámicos' | 'Webtoon / tiras'
  /** Polígonos convexos en coordenadas normalizadas del área útil (0..1). */
  polys: Pt[][]
}

export interface TemplateMeta {
  categories: TemplateCategory[]
  style: TemplateStyle
  shape: TemplateShape
  /** Una línea: para qué sirve. */
  use: string
}

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  portada: 'Portada',
  accion: 'Acción',
  dialogo: 'Diálogo',
  tira: 'Tira',
  yonkoma: 'Yonkoma',
  splash: 'Splash',
  webtoon: 'Webtoon',
  storyboard: 'Storyboard',
}

/** Organización de las plantillas (no cambia sus viñetas). */
export const TEMPLATE_META: Record<string, TemplateMeta> = {
  splash: { categories: ['splash', 'portada'], style: 'neutral', shape: 'vertical', use: 'Una sola imagen a página completa: portadas y momentos clave.' },
  'two-rows': { categories: ['dialogo'], style: 'neutral', shape: 'vertical', use: 'Dos bandas anchas para paisajes o conversaciones.' },
  'two-cols': { categories: ['dialogo', 'accion'], style: 'neutral', shape: 'vertical', use: 'Dos columnas altas: personajes de cuerpo entero o un antes y después.' },
  'three-mixed': { categories: ['dialogo', 'portada'], style: 'neutral', shape: 'vertical', use: 'Una viñeta ancha arriba y dos abajo: presentar y reaccionar.' },
  'three-rows': { categories: ['dialogo'], style: 'neutral', shape: 'vertical', use: 'Tres bandas: ritmo pausado, ideal para diálogo.' },
  'grid-2x2': { categories: ['dialogo'], style: 'neutral', shape: 'vertical', use: 'Cuatro viñetas iguales para un intercambio parejo.' },
  'classic-6': { categories: ['dialogo'], style: 'occidental', shape: 'vertical', use: 'La página clásica de cómic: seis viñetas de lectura clara.' },
  'grid-9': { categories: ['dialogo'], style: 'occidental', shape: 'vertical', use: 'Nueve viñetas: mucho diálogo o tiempo que pasa.' },
  'hero-top': { categories: ['portada', 'accion'], style: 'neutral', shape: 'vertical', use: 'Una viñeta grande arriba para presentar la escena.' },
  'hero-mid': { categories: ['accion'], style: 'neutral', shape: 'vertical', use: 'El golpe o la revelación en el centro de la página.' },
  'mixed-5': { categories: ['accion', 'dialogo'], style: 'occidental', shape: 'vertical', use: 'Cinco viñetas con anchos variados para dar ritmo.' },
  'manga-dynamic': { categories: ['accion'], style: 'manga', shape: 'vertical', use: 'Cortes en diagonal típicos del manga, lectura der → izq.' },
  'manga-vertical': { categories: ['accion', 'dialogo'], style: 'manga', shape: 'vertical', use: 'Columnas altas para personajes de cuerpo entero.' },
  'manga-action': { categories: ['accion'], style: 'manga', shape: 'vertical', use: 'Diagonales fuertes para peleas y movimiento.' },
  'manga-4koma': { categories: ['yonkoma', 'tira'], style: 'manga', shape: 'vertical', use: 'Cuatro viñetas verticales: el chiste en cuatro tiempos.' },
  shards: { categories: ['accion'], style: 'neutral', shape: 'vertical', use: 'Fragmentos irregulares para tensión o caos.' },
  zigzag: { categories: ['accion'], style: 'neutral', shape: 'vertical', use: 'Zigzag que guía la mirada por la página.' },
  'webtoon-stack': { categories: ['webtoon'], style: 'neutral', shape: 'larga', use: 'Viñetas apiladas con aire para leer en el celular.' },
  'strip-3': { categories: ['tira'], style: 'occidental', shape: 'horizontal', use: 'Tira de diario de tres viñetas.' },
  'strip-4': { categories: ['tira'], style: 'occidental', shape: 'horizontal', use: 'Tira de cuatro viñetas para redes o diario.' },
  'storyboard-6': { categories: ['storyboard'], style: 'neutral', shape: 'horizontal', use: 'Seis cuadros 16:9 con lugar abajo para notas de cámara y acción.' },
}

/** Forma de página para filtrar plantillas según el formato del proyecto. */
export function formatShape(f: Pick<PageFormat, 'width' | 'height'>): TemplateShape {
  const r = f.width / f.height
  return r > 1.3 ? 'horizontal' : r < 0.45 ? 'larga' : 'vertical'
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
  { id: 'two-cols', name: '2 columnas', group: 'Clásicos', polys: grid([{ h: 1, cols: [1, 1] }]) },
  { id: 'three-mixed', name: '3 viñetas', group: 'Clásicos', polys: grid([{ h: 1.2, cols: [1] }, { h: 1, cols: [1, 1] }]) },
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
  {
    id: 'storyboard-6',
    name: 'Storyboard 6',
    group: 'Webtoon / tiras',
    // Cuadros 16:9 (en A4 apaisada) con una franja libre debajo de cada fila para escribir.
    polys: [0, 1, 2].flatMap((c) => [rect(c / 3, 0, 1 / 3, 0.28), rect(c / 3, 0.5, 1 / 3, 0.28)]),
  },
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

/** Plantillas iniciales destacadas (estructura completa de página). `null` = página libre (sin viñetas). */
export const STARTER_TEMPLATES: { id: string | null; name: string; use: string }[] = [
  { id: 'classic-6', name: 'Cómic clásico', use: 'Seis viñetas de lectura clara, izquierda a derecha.' },
  { id: 'manga-dynamic', name: 'Manga', use: 'Cortes en diagonal y lectura de derecha a izquierda.' },
  { id: 'webtoon-stack', name: 'Webtoon', use: 'Viñetas apiladas con aire para el scroll del celular.' },
  { id: 'storyboard-6', name: 'Storyboard', use: 'Cuadros 16:9 con espacio para notas de cámara.' },
  { id: 'strip-3', name: 'Tira de 3 viñetas', use: 'Planteo, desarrollo y remate, en horizontal.' },
  { id: 'splash', name: 'Página splash', use: 'Una sola imagen a página completa.' },
  { id: null, name: 'Página libre', use: 'Sin viñetas: dibujalas a mano o poné lo que quieras.' },
]

/** Accesos rápidos para empezar una página (estado vacío y barra de plantillas). `null` = página libre. */
export const QUICK_LAYOUTS: { id: string | null; label: string }[] = [
  { id: 'splash', label: '1 viñeta' },
  { id: 'two-cols', label: '2 verticales' },
  { id: 'two-rows', label: '2 horizontales' },
  { id: 'three-mixed', label: '3 viñetas' },
  { id: 'grid-2x2', label: '4 clásico' },
  { id: 'classic-6', label: '6 clásico' },
  { id: null, label: 'Página libre' },
]
