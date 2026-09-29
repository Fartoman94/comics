import type { Asset, BubbleElement, BubbleShape, ComicElement, Page, PanelElement, Project, TextElement } from '../types'
import { DEFAULT_FILTERS } from '../types'
import { createBubble, createPanel, createText, TEXT_PRESETS } from '../lib/factories'
import { getFormat } from '../lib/formats'
import { buildTemplatePanels, TEMPLATES } from '../lib/templates'
import { coverFit } from '../lib/placement'
import { getAssetBlob, putAssetBlob } from '../lib/storage'
import { uid } from '../lib/id'
import * as art from './art'

/** Versión de las ilustraciones: al cambiarla se regeneran en IndexedDB. */
const ART_VERSION = 6

export const ARTS = {
  cover: () => art.artCover(),
  school: () => art.artSchool(),
  feet: () => art.artFeet(),
  clock: () => art.artClock(),
  hanaPanic: () => art.artHana('open', { sweat: true, bg: 'lines' }),
  eyes: () => art.artEyes(),
  collision: () => art.artCollision(),
  renCalm: () => art.artRen('calm', { look: -4 }),
  hanaShy: () => art.artHana('shy', { blush: true, bg: 'sparkle', look: 5 }),
  rooftop: () => art.artRooftop(),
  hanaSurprised: () => art.artHana('surprised', { bg: 'tone' }),
  renSmile: () => art.artRen('smile', { bg: 'tone', blush: true }),
  petals: () => art.artPetalsClose(),
  hanaJoy: () => art.artHana('joy', { blush: true, bg: 'sparkle', tilt: 4 }),
  sunset: () => art.artSunset(),
  end: () => art.artEndCard(),
} as const

export type ArtKey = keyof typeof ARTS

function svgSize(svg: string) {
  const m = svg.match(/viewBox="0 0 (\d+) (\d+)"/)!
  return { w: Number(m[1]), h: Number(m[2]) }
}

export async function rasterize(svg: string, mime = 'image/png', quality?: number, maxSide = 1700): Promise<{ blob: Blob; width: number; height: number }> {
  const { w, h } = svgSize(svg)
  const scale = Math.min(1.6, maxSide / Math.max(w, h))
  const img = new Image()
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), mime, quality))
  return { blob, width: canvas.width, height: canvas.height }
}

/**
 * Las ilustraciones vienen pre-renderizadas en /public/demo (WebP livianos, generados con
 * scripts/build-demo-art.mjs). Si faltan, se rasterizan en el navegador a partir del SVG.
 */
async function ensureAssets(onProgress?: (done: number, total: number) => void): Promise<Record<ArtKey, Asset>> {
  const keys = Object.keys(ARTS) as ArtKey[]
  const out = {} as Record<ArtKey, Asset>
  const manifest: Record<string, { w: number; h: number }> = await fetch('/demo/manifest.json')
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
  let done = 0
  await Promise.all(
    keys.map(async (key) => {
      const id = `demo_${key}_v${ART_VERSION}`
      let dims = manifest[key]
      if (!(await getAssetBlob(id)) || !dims) {
        const fetched = dims ? await fetch(`/demo/${key}.webp`).then((r) => (r.ok ? r.blob() : null)).catch(() => null) : null
        if (fetched) await putAssetBlob(id, fetched)
        else {
          const r = await rasterize(ARTS[key]())
          await putAssetBlob(id, r.blob)
          dims = { w: r.width, h: r.height }
        }
      }
      out[key] = { id, name: key, width: dims.w, height: dims.h, mime: 'image/webp', createdAt: 0 }
      onProgress?.(++done, keys.length)
    }),
  )
  return out
}

// ---------- Ayudantes de maquetación ----------

type Rel = [number, number]

function fill(panel: PanelElement, asset: Asset, zoom = 1, shift: Rel = [0, 0]) {
  const fit = coverFit(panel, asset)
  const scale = fit.scale * zoom
  const x = (panel.width - asset.width * scale) / 2 + shift[0] * panel.width
  const y = (panel.height - asset.height * scale) / 2 + shift[1] * panel.height
  panel.image = { assetId: asset.id, x, y, scale, filters: { ...DEFAULT_FILTERS } }
  panel.strokeWidth = 4
  return panel
}

function bubble(p: PanelElement, shape: BubbleShape, text: string, at: Rel, size: Rel, tail: Rel | null, patch: Partial<BubbleElement> = {}): BubbleElement {
  const b = createBubble(shape, 0, 0, 1)
  b.width = Math.round(size[0] * p.width)
  b.height = Math.round(size[1] * p.width)
  b.x = Math.round(p.x + at[0] * p.width - b.width / 2)
  b.y = Math.round(p.y + at[1] * p.height - b.height / 2)
  b.text = text
  b.fontSize = shape === 'shout' ? 24 : shape === 'box' ? 17 : 19
  b.padding = shape === 'box' ? 12 : 14
  b.uppercase = shape !== 'box'
  b.fontFamily = shape === 'box' ? 'Special Elite' : shape === 'shout' ? 'Bangers' : 'Comic Neue'
  b.fontStyle = shape === 'box' ? 'normal' : 'bold'
  if (tail) {
    b.tail = true
    b.tailX = p.x + tail[0] * p.width - b.x
    b.tailY = p.y + tail[1] * p.height - b.y
  } else b.tail = false
  b.name = shape === 'box' ? 'Narración' : 'Globo'
  return Object.assign(b, patch)
}

function sfx(p: PanelElement, text: string, at: Rel, fontSize: number, patch: Partial<TextElement> = {}): TextElement {
  const t = createText(0, 0, TEXT_PRESETS[1])
  const chars = [...text].length
  t.text = text
  t.fontFamily = 'Dela Gothic One'
  t.fontStyle = 'normal'
  t.fontSize = fontSize
  t.textColor = '#111111'
  t.stroke = '#ffffff'
  t.strokeWidth = Math.max(4, Math.round(fontSize / 12))
  t.vertical = patch.vertical ?? true
  t.width = t.vertical ? Math.round(fontSize * 1.5) : Math.round(chars * fontSize * 1.05 + 30)
  t.height = t.vertical ? Math.round(chars * (fontSize + 2) + 24) : Math.round(fontSize * 1.4)
  t.x = Math.round(p.x + at[0] * p.width - t.width / 2)
  t.y = Math.round(p.y + at[1] * p.height - t.height / 2)
  t.name = `SFX ${text}`
  return Object.assign(t, patch)
}

function panelsFor(templateId: string, margin: number, gutter: number) {
  const format = getFormat('manga-tankobon')
  return buildTemplatePanels(TEMPLATES.find((t) => t.id === templateId)!, format, margin, gutter)
}

function page(name: string, elements: ComicElement[], background = '#ffffff'): Page {
  return { id: uid('pg_'), name, background, elements }
}

// ---------- El manga ----------

export async function buildDemoProject(onProgress?: (done: number, total: number) => void): Promise<Project> {
  const A = await ensureAssets(onProgress)
  const format = getFormat('manga-tankobon')
  const { width: W, height: H } = format
  const M = format.margin
  const G = 14

  // Portada
  const coverArt = fill(createPanel(0, 0, W, H), A.cover, 1.05, [0, 0.02])
  coverArt.strokeWidth = 0
  coverArt.name = 'Ilustración de portada'
  const jpTitle = sfx(coverArt, '桜の風', [0.86, 0.2], 92, { fontFamily: 'Noto Serif JP', fontStyle: 'bold', stroke: '#ffffff', strokeWidth: 10, name: 'Título japonés' })
  const title = createText(0, 0, TEXT_PRESETS[3])
  Object.assign(title, { text: 'VIENTO DE SAKURA', fontSize: 66, width: W - 80, height: 90, x: 40, y: H - 215, strokeWidth: 11, name: 'Título' })
  const subtitle = createText(0, 0, TEXT_PRESETS[4])
  Object.assign(subtitle, { text: 'Manga de ejemplo · hecho en Viñeta Studio', fontSize: 22, textColor: '#ffffff', stroke: '#111111', strokeWidth: 5, width: W - 80, height: 36, x: 40, y: H - 122, name: 'Subtítulo' })
  const vol = createText(0, 0, TEXT_PRESETS[4])
  Object.assign(vol, { text: 'VOL. 1', fontFamily: 'Bangers', fontSize: 34, textColor: '#ffffff', stroke: '#111111', strokeWidth: 6, width: 130, height: 46, x: 36, y: 34, name: 'Volumen', letterSpacing: 2 })
  const cover = page('Portada', [coverArt, jpTitle, title, subtitle, vol], '#111111')

  // Página 1: llega tarde
  const p1 = panelsFor('manga-vertical', M, G)
  fill(p1[0], A.school)
  fill(p1[1], A.feet, 1, [-0.25, 0])
  fill(p1[2], A.hanaPanic, 1.08, [0, 0.06])
  fill(p1[3], A.clock, 0.95)
  const page1 = page('Página 1', [
    ...p1,
    bubble(p1[0], 'box', 'Abril. Primer día de clases.', [0.26, 0.16], [0.38, 0.13], null),
    sfx(p1[1], 'タッタッ', [0.8, 0.3], 58),
    bubble(p1[2], 'shout', '¡Llego tarde!', [0.5, 0.2], [0.9, 0.46], [0.6, 0.62], { fontSize: 26 }),
    sfx(p1[3], 'チクタク', [0.12, 0.5], 34, { vertical: true, strokeWidth: 5 }),
    bubble(p1[3], 'box', '8:29. Un minuto para la campana.', [0.62, 0.86], [0.78, 0.2], null, { fontSize: 15 }),
  ])

  // Página 2: el choque
  const p2 = panelsFor('manga-action', M, G)
  fill(p2[0], A.eyes, 1, [0, 0.03])
  fill(p2[1], A.collision)
  fill(p2[2], A.hanaShy, 1.15, [0, 0.12])
  fill(p2[3], A.renCalm, 1.15, [0, 0.1])
  const page2 = page('Página 2', [
    ...p2,
    sfx(p2[0], '!?', [0.9, 0.5], 64, { vertical: false, fontFamily: 'Bangers', strokeWidth: 8 }),
    sfx(p2[1], 'ドンッ!!', [0.22, 0.52], 104, { rotation: -8, strokeWidth: 12 }),
    bubble(p2[1], 'shout', '¡¡Kyaa!!', [0.8, 0.2], [0.38, 0.3], null),
    bubble(p2[3], 'speech', '¿Estás bien?', [0.5, 0.18], [0.7, 0.4], [0.3, 0.45]),
    bubble(p2[2], 'whisper', 'S-sí... perdón...', [0.46, 0.17], [0.74, 0.4], [0.6, 0.48]),
    sfx(p2[2], 'ドキッ', [0.1, 0.72], 34, { strokeWidth: 5 }),
  ])

  // Página 3: la azotea
  const p3 = panelsFor('hero-top', M, G)
  fill(p3[0], A.rooftop)
  fill(p3[1], A.petals)
  fill(p3[2], A.renSmile, 1.2, [0, 0.12])
  fill(p3[3], A.hanaSurprised, 1.2, [0, 0.12])
  const page3 = page('Página 3', [
    ...p3,
    bubble(p3[0], 'box', 'Ese mismo día, en la azotea...', [0.27, 0.12], [0.44, 0.12], null),
    sfx(p3[0], 'ヒュウウウ', [0.92, 0.45], 42),
    bubble(p3[3], 'shout', '¡Sos el de esta mañana!', [0.5, 0.2], [1.05, 0.72], [0.55, 0.5], { fontSize: 18 }),
    bubble(p3[2], 'speech', 'Se te cayó tu cuaderno.', [0.5, 0.2], [0.95, 0.66], [0.4, 0.55], { fontSize: 16 }),
    bubble(p3[1], 'box', 'Dicen que el viento de sakura trae encuentros.', [0.5, 0.78], [0.92, 0.42], null, { fontSize: 14 }),
  ])

  // Página 4: continuará
  const p4 = panelsFor('two-rows', M, G)
  fill(p4[0], A.hanaJoy, 1, [0, 0.06])
  fill(p4[1], A.sunset)
  const page4 = page('Página 4', [
    ...p4,
    bubble(p4[0], 'thought', 'Tal vez... este año sea distinto.', [0.24, 0.24], [0.4, 0.3], [0.38, 0.5]),
    sfx(p4[0], 'ドキドキ', [0.9, 0.42], 50),
    bubble(p4[1], 'speech', '¡Hasta mañana, Hana!', [0.72, 0.22], [0.42, 0.22], [0.52, 0.6], { fontSize: 17 }),
    bubble(p4[1], 'box', 'Continuará...', [0.18, 0.88], [0.28, 0.1], null, { fontFamily: 'Bangers', fontSize: 24, align: 'center' }),
  ])

  // Contratapa
  const endArt = fill(createPanel(M + 50, 240, W - M * 2 - 100, W - M * 2 - 100), A.end)
  endArt.stroke = '#ffffff'
  const fin = createText(0, 0, TEXT_PRESETS[3])
  Object.assign(fin, { text: 'FIN', fontSize: 120, width: W, height: 150, x: 0, y: 70, strokeWidth: 0, textColor: '#ffffff', shadow: false, name: 'FIN' })
  const credits = createText(0, 0, TEXT_PRESETS[4])
  Object.assign(credits, {
    text: 'Guion, dibujo y rotulado hechos 100% en Viñeta Studio.\nCreado por MateLabs · matelabs.site',
    fontSize: 22,
    textColor: '#ffffff',
    width: W - 100,
    height: 90,
    x: 50,
    y: H - 175,
    lineHeight: 1.4,
    name: 'Créditos',
  })
  const back = page('Contratapa', [endArt, fin, credits], '#111111')

  const now = Date.now()
  return {
    id: DEMO_PROJECT_ID,
    version: 1,
    title: 'Viento de sakura (demo)',
    author: 'Viñeta Studio · MateLabs',
    synopsis: 'Hana llega tarde a su primer día de clases y choca con Ren. Un one-shot de ejemplo en estilo manga.',
    kind: 'manga',
    format,
    readingDirection: 'rtl',
    pages: [cover, page1, page2, page3, page4, back],
    assets: Object.values(A),
    thumbnail: null,
    createdAt: now,
    updatedAt: now,
  }
}

export const DEMO_PROJECT_ID = 'demo'

/** Portada en SVG para mostrar en el inicio sin generar nada. */
export function demoCoverDataUrl() {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(art.artCover())
}
