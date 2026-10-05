import type { Asset, BubbleElement, BubbleShape, ComicElement, Page, PanelElement, Project, TextElement } from '../types'
import { createBubble, createEffect, createPanel, createProject, createText, TEXT_PRESETS } from '../lib/factories'
import { getFormat } from '../lib/formats'
import { buildTemplatePanels, TEMPLATES } from '../lib/templates'
import { coverFit } from '../lib/imageFit'
import { getAssetBlob, putAssetBlob } from '../lib/storage'
import { uid } from '../lib/id'
import { rasterize } from '../demo/demoProject'
import { shotSvg } from './engine/compose'
import { measureTextHeight } from '../lib/textFit'
import { bubbleTextBox } from '../components/editor/nodes/bubblePath'
import type { Line, LineKind, PanelDef, Shot, StyleId, WorkDef } from './types'

/**
 * Construye el proyecto real de Viñeta Studio de una muestra: las mismas piezas que usa una
 * persona en el editor (páginas, viñetas de plantilla o a mano, imágenes encuadradas, globos,
 * narraciones, onomatopeyas y efectos). Las ilustraciones se rasterizan una vez y quedan como
 * recursos del proyecto.
 */

const BUBBLE_OF: Record<LineKind, BubbleShape> = {
  dialogue: 'speech',
  thought: 'thought',
  shout: 'shout',
  whisper: 'whisper',
  caption: 'box',
  narration: 'rounded-box',
  impact: 'impact',
}

/** Tipografías de rotulado por estilo (globos, narración, onomatopeyas). */
const FONTS: Record<StyleId, { talk: string; caption: string; sfx: string; upper: boolean }> = {
  western: { talk: 'Comic Neue', caption: 'Comic Neue', sfx: 'Bangers', upper: true },
  shonen: { talk: 'Comic Neue', caption: 'Special Elite', sfx: 'Bangers', upper: false },
  seinen: { talk: 'Comic Neue', caption: 'Special Elite', sfx: 'Special Elite', upper: false },
  shojo: { talk: 'Comic Neue', caption: 'Comic Neue', sfx: 'Permanent Marker', upper: false },
  webtoon: { talk: 'Comic Neue', caption: 'Comic Neue', sfx: 'Luckiest Guy', upper: false },
  anime: { talk: 'Comic Neue', caption: 'Special Elite', sfx: 'Bangers', upper: false },
}

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0).toString(36)
}

export interface BuildProgress {
  done: number
  total: number
}

/** Panels del layout dentro de la zona segura (plantilla del editor o cajas propias). */
function layoutPanels(page: WorkDef['pages'][number], format: ReturnType<typeof getFormat>): PanelElement[] {
  const margin = format.margin
  const gutter = Math.round(format.width * 0.018)
  if ('template' in page.layout) {
    const tpl = TEMPLATES.find((t) => t.id === (page.layout as { template: string }).template)!
    return buildTemplatePanels(tpl, format, margin, gutter)
  }
  const aw = format.width - margin * 2
  const ah = format.height - margin * 2
  return page.layout.boxes.map(([x, y, w, h], i) => {
    const p = createPanel(Math.round(margin + x * aw), Math.round(margin + y * ah), Math.round(w * aw), Math.round(h * ah))
    p.name = `Viñeta ${i + 1}`
    return p
  })
}

/** Alto aproximado del texto (sin Konva: la muestra se arma también desde el inicio). */
function estimateBubble(text: string, fontSize: number, shape: BubbleShape, maxW: number, wide = false) {
  const box = shape === 'box' || shape === 'rounded-box'
  const k = shape === 'impact' ? 0.6 : box ? 1 : 0.72
  const padF = box ? 2 : 0.6
  const pad = fontSize * 0.7
  // Special Elite (máquina de escribir) es más ancha que Comic Neue.
  const charW = fontSize * (wide ? 0.64 : 0.57)
  const chars = [...text].length
  // Caracteres por línea: lo ideal para rotular, sin pasar lo que entra en el ancho disponible.
  const fits = Math.max(6, Math.floor((maxW * k - pad * padF) / charW))
  const longestWord = Math.max(1, ...text.split(/\s+/).map((w) => [...w].length))
  const perLine = Math.min(fits, Math.max(longestWord, Math.min(24, Math.ceil(Math.sqrt(chars * 2.4)))))
  const tw = perLine * charW
  // Reparto por palabras para contar las líneas reales.
  let lines = 0
  for (const para of text.split('\n')) {
    let cur = 0
    lines++
    for (const w of para.split(/\s+/)) {
      const len = [...w].length
      if (cur && cur + 1 + len > perLine) {
        lines++
        cur = len
      } else cur += (cur ? 1 : 0) + len
    }
  }
  const th = lines * fontSize * 1.2
  return { width: Math.round((tw + pad * padF) / k), height: Math.round((th + pad * padF) / k), pad }
}

function speakerX(def: PanelDef, who: string | undefined, panel: PanelElement) {
  const c = def.shot.chars?.find((x) => x.id === who)
  if (!c) return panel.x + panel.width / 2
  const n = def.shot.chars!.length
  const i = def.shot.chars!.indexOf(c)
  const rel = c.x ?? (n === 1 ? 0.5 : 0.18 + (0.64 * i) / Math.max(1, n - 1))
  return panel.x + rel * panel.width
}

/** Globos y narraciones de una viñeta, apilados de arriba hacia abajo en el sentido de lectura. */
function linesFor(work: WorkDef, def: PanelDef, panel: PanelElement, scale: number): ComicElement[] {
  const out: ComicElement[] = []
  const fonts = FONTS[work.style]
  const rtl = work.readingDirection === 'rtl'
  let y = panel.y + panel.height * 0.04
  const placed: { x: number; y: number; w: number; h: number }[] = []
  ;(def.lines ?? []).forEach((l: Line, i) => {
    const shape = BUBBLE_OF[l.kind]
    const b = createBubble(shape, 0, 0, scale)
    const box = shape === 'box' || shape === 'rounded-box'
    b.text = l.text
    b.uppercase = fonts.upper && !box
    b.fontFamily = box ? fonts.caption : fonts.talk
    b.fontStyle = box ? 'normal' : 'bold'
    // En viñetas angostas la letra baja un poco para que las palabras no se partan.
    b.fontSize = Math.round(Math.min((box ? 22 : 24) * scale, panel.width / 10))
    if (shape === 'impact') b.fontSize = Math.round(Math.min(34 * scale, panel.width / 7))
    if (work.style === 'seinen' && box) b.fill = '#ffffff'
    if (work.style === 'webtoon' && box) b.fill = '#fff3d6'
    if (work.style === 'anime' && box) b.fill = '#1b1530'
    if (work.style === 'anime' && box) b.textColor = '#f4ecff'
    const maxW = panel.width * (panel.width < 400 * scale ? 0.92 : 0.62)
    const wide = b.fontFamily === 'Special Elite' || b.uppercase
    const sizeFor = () => {
      const size = estimateBubble(b.uppercase ? l.text.toUpperCase() : l.text, b.fontSize, shape, Math.max(140, maxW), wide)
      b.width = Math.min(size.width, Math.round(panel.width * 0.92))
      b.height = size.height
      b.padding = Math.round(size.pad)
      // Medición real con la tipografía cargada (Konva): si el texto no entra, el globo crece.
      const tb = bubbleTextBox(b)
      const need = measureTextHeight({ text: b.text, width: tb.width, fontFamily: b.fontFamily, fontSize: b.fontSize, fontStyle: b.fontStyle, lineHeight: b.lineHeight, letterSpacing: b.letterSpacing, uppercase: b.uppercase })
      if (need > tb.height) b.height = Math.round(b.height + (need - tb.height) / (shape === 'impact' ? 0.6 : box ? 1 : 0.72) + 4)
    }
    // Busca un lugar libre dentro de la viñeta (en el orden de lectura); si no hay, achica la letra.
    const first = rtl ? 'right' : 'left'
    const prefer = box ? [first] : i % 2 === 0 ? [first, first === 'left' ? 'right' : 'left', 'center'] : [first === 'left' ? 'right' : 'left', first, 'center']
    let spot: { x: number; y: number } | null = null
    for (let attempt = 0; attempt < 5 && !spot; attempt++) {
      sizeFor()
      const pad = 8
      for (let yy = panel.y + panel.height * 0.03; yy + b.height <= panel.y + panel.height - pad && !spot; yy += panel.height * 0.05) {
        for (const side of prefer) {
          const xx = side === 'left' ? panel.x + panel.width * 0.04 : side === 'right' ? panel.x + panel.width * 0.96 - b.width : panel.x + (panel.width - b.width) / 2
          const r = { x: xx, y: yy, w: b.width, h: b.height }
          if (xx < panel.x + 2 || xx + b.width > panel.x + panel.width - 2) continue
          if (placed.every((o) => r.x >= o.x + o.w + 6 || r.x + r.w + 6 <= o.x || r.y >= o.y + o.h + 6 || r.y + r.h + 6 <= o.y)) {
            spot = { x: xx, y: yy }
            break
          }
        }
      }
      if (!spot) b.fontSize = Math.max(10, Math.round(b.fontSize * 0.86))
    }
    b.x = Math.round(spot ? spot.x : panel.x + panel.width * 0.04)
    b.y = Math.round(spot ? spot.y : panel.y + panel.height * 0.03)
    placed.push({ x: b.x, y: b.y, w: b.width, h: b.height })
    y = Math.max(y, b.y + b.height)
    if (b.tail) {
      const sx = speakerX(def, l.who, panel)
      b.tailX = Math.max(-b.width * 0.2, Math.min(b.width * 1.2, sx - b.x))
      b.tailY = Math.min(b.height + panel.height * 0.18, panel.y + panel.height * 0.7 - b.y)
      if (b.tailY < b.height + 10) b.tailY = b.height + 30 * scale
    }
    b.name = l.who ? `${work.characters.find((c) => c.id === l.who)?.name.split(' ')[0] ?? 'Globo'} · ${b.name}` : b.name
    out.push(b as BubbleElement)
  })
  for (const sfx of def.sfx ?? []) {
    const t = createText(0, 0, TEXT_PRESETS[0])
    const big = sfx.size === 'big' ? 0.26 : sfx.size === 'small' ? 0.1 : 0.17
    t.text = sfx.text
    t.name = `SFX ${sfx.text}`
    t.fontFamily = fonts.sfx
    t.fontSize = Math.round(Math.min(panel.width, panel.height * 1.3) * big)
    t.textColor = sfx.color ?? (work.style === 'western' || work.style === 'anime' ? '#ffd23f' : '#111111')
    t.stroke = t.textColor === '#111111' ? '#ffffff' : '#111111'
    t.strokeWidth = Math.max(3, Math.round(t.fontSize * 0.07))
    t.shadow = work.style === 'western'
    t.shadowColor = '#e11d48'
    t.skewX = work.style === 'seinen' ? 0 : -0.12
    t.uppercase = work.style !== 'seinen' && work.style !== 'shojo'
    t.width = Math.round(Math.min(panel.width * 0.9, [...sfx.text].length * t.fontSize * 0.62 + t.fontSize))
    t.height = Math.round(t.fontSize * 1.25)
    t.rotation = sfx.rotate ?? -8
    t.x = Math.round(panel.x + (panel.width - t.width) * (out.length % 2 ? 0.2 : 0.75))
    // Debajo de los globos, sin taparlos.
    t.y = Math.round(Math.min(panel.y + panel.height - t.height * 0.9, Math.max(y + 8, panel.y + panel.height * 0.5 - t.height / 2)))
    y = t.y + t.height
    out.push(t as TextElement)
  }
  return out
}

/** Arma el proyecto completo. `onProgress` informa cuántas ilustraciones van. */
export async function buildWorkProject(work: WorkDef, onProgress?: (p: BuildProgress) => void): Promise<Project> {
  const format = getFormat(work.formatId)
  // Medidor de texto de Konva y tipografías de rotulado listas antes de calcular globos.
  await import('../lib/textFitKonva')
  const { loadFonts } = await import('../lib/fonts')
  const f = FONTS[work.style]
  await loadFonts([f.talk, f.caption, f.sfx, 'Luckiest Guy']).catch(() => undefined)
  const project = createProject({ title: work.subtitle ? `${work.title} — ${work.subtitle}` : work.title, author: 'Muestra de Viñeta Studio', kind: work.kind, formatId: work.formatId, pages: 1, templateId: null, readingDirection: work.readingDirection })
  project.synopsis = work.logline
  project.pages = []
  const scale = format.width / 900
  const assets = new Map<string, Asset>()
  const total = work.pages.reduce((n, p) => n + p.panels.length, 0) + 1
  let done = 0

  const art = async (shot: Shot, pw: number, ph: number, seed: number) => {
    const W = 900
    const H = Math.max(200, Math.min(2700, Math.round((W * ph) / pw)))
    const svg = shotSvg(work.style, work.characters, shot, W, H, seed)
    const id = `smp_${work.id}_${hash(svg)}`
    let a = assets.get(id)
    if (!a) {
      const existing = await getAssetBlob(id)
      let dims = { width: W, height: H }
      if (!existing) {
        const r = await rasterize(svg, 'image/webp', 0.86, 1400)
        await putAssetBlob(id, r.blob)
        dims = { width: r.width, height: r.height }
      } else {
        dims = { width: Math.round(W * Math.min(1.6, 1400 / Math.max(W, H))), height: Math.round(H * Math.min(1.6, 1400 / Math.max(W, H))) }
      }
      a = { id, name: `${work.id} · ilustración ${assets.size + 1}`, width: dims.width, height: dims.height, mime: 'image/webp', createdAt: Date.now() }
      assets.set(id, a)
    }
    onProgress?.({ done: ++done, total })
    return a
  }

  const fill = (panel: PanelElement, asset: Asset) => {
    panel.image = { assetId: asset.id, ...coverFit(panel, asset), filters: { grayscale: false, sepia: false, invert: false, brightness: 0, contrast: 0, threshold: 0, blur: 0 } }
  }

  // Portada: imagen a página completa, título, subtítulo y bajada (plantilla "Portada").
  const coverPage: Page = { id: uid('pg_'), name: 'Portada', background: '#111111', elements: [] }
  const cp = createPanel(0, 0, format.width, format.height)
  cp.name = 'Imagen de portada'
  cp.strokeWidth = 0
  // En la portada, los personajes en plano medio: caras grandes y legibles en miniatura.
  const coverShot = { ...work.cover.shot, chars: work.cover.shot.chars?.map((c) => (c.framing === 'full' || !c.framing ? { ...c, framing: 'half' as const } : c)) }
  fill(cp, await art(coverShot, format.width, format.height, 7))
  const title = createText(Math.round(format.width * 0.05), Math.round(format.height * 0.05), TEXT_PRESETS.find((p) => p.id === 'title')!)
  Object.assign(title, { name: 'Título', text: work.title.toUpperCase(), width: Math.round(format.width * 0.9), height: Math.round(format.height * 0.13), fontSize: Math.round(format.width * (work.title.length > 14 ? 0.085 : 0.12)), textColor: '#ffffff', stroke: '#111111', strokeWidth: Math.round(format.width * 0.012) })
  const sub = createText(Math.round(format.width * 0.08), Math.round(format.height * 0.18), TEXT_PRESETS.find((p) => p.id === 'caption')!)
  Object.assign(sub, { name: 'Subtítulo', text: work.cover.subtitle ?? work.subtitle ?? '', width: Math.round(format.width * 0.84), height: Math.round(format.height * 0.1), fontSize: Math.round(format.width * ((work.cover.subtitle ?? work.subtitle ?? '').length > 28 ? 0.032 : 0.042)), textColor: '#ffffff', stroke: '#111111', strokeWidth: Math.round(format.width * 0.012), uppercase: true })
  const tag = createText(Math.round(format.width * 0.08), Math.round(format.height * 0.87), TEXT_PRESETS.find((p) => p.id === 'caption')!)
  Object.assign(tag, { name: 'Bajada', text: work.cover.tagline, width: Math.round(format.width * 0.84), height: Math.round(format.height * 0.08), fontSize: Math.round(format.width * 0.032), textColor: '#ffffff', stroke: '#111111', strokeWidth: Math.round(format.width * 0.008), shadow: true, shadowColor: '#000000' })
  coverPage.elements = [cp, title, sub, tag]
  project.pages.push(coverPage)

  for (const [pi, page] of work.pages.entries()) {
    const panels = layoutPanels(page, format)
    const els: ComicElement[] = []
    const above: ComicElement[] = []
    for (const [i, panel] of panels.entries()) {
      const def = page.panels[i]
      fill(panel, await art(def.shot, panel.width, panel.height, pi * 31 + i * 7 + 3))
      if (work.style === 'seinen' || work.style === 'shonen' || work.style === 'shojo') panel.strokeWidth = Math.round(4 * scale)
      if (work.style === 'webtoon') panel.strokeWidth = 0
      els.push(panel)
      if (def.fx) {
        const e = createEffect(def.fx, panel.x, panel.y, panel.width, panel.height)
        e.opacity = def.fx === 'screentone' || def.fx === 'gradient-tone' ? 0.35 : 0.55
        e.blend = 'multiply'
        if (def.fx === 'screentone' || def.fx === 'gradient-tone') {
          e.density = Math.max(6, Math.round(10 * scale))
          e.dotSize = 2.4 * scale
        }
        els.push(e)
      }
      above.push(...linesFor(work, def, panel, scale))
    }
    project.pages.push({ id: uid('pg_'), name: `Página ${pi + 1}`, background: work.style === 'webtoon' ? '#fbf7ff' : '#ffffff', elements: [...els, ...above] })
  }
  project.assets = [...assets.values()]
  project.updatedAt = Date.now()
  return project
}
