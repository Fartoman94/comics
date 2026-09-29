import type { Asset, ComicElement, PanelElement } from '../types'
import { DEFAULT_FILTERS } from '../types'
import { createImage } from './factories'
import { pointInPolygon, rotatePoint, type Pt } from './geometry'
import { importImageFile } from './storage'
import { currentPage, useEditor } from '../store/editor'

/** Encaje "cover": la imagen llena la viñeta sin deformarse. */
export function coverFit(panel: { width: number; height: number }, asset: { width: number; height: number }) {
  const scale = Math.max(panel.width / asset.width, panel.height / asset.height)
  return { x: (panel.width - asset.width * scale) / 2, y: (panel.height - asset.height * scale) / 2, scale }
}

export function containFit(panel: { width: number; height: number }, asset: { width: number; height: number }) {
  const scale = Math.min(panel.width / asset.width, panel.height / asset.height)
  return { x: (panel.width - asset.width * scale) / 2, y: (panel.height - asset.height * scale) / 2, scale }
}

export function hitsElement(el: ComicElement, p: Pt): boolean {
  // Pasamos el punto al sistema local del elemento (deshaciendo la rotación).
  const local = el.rotation ? rotatePoint(p, { x: el.x, y: el.y }, -el.rotation) : p
  const lx = local.x - el.x
  const ly = local.y - el.y
  if (lx < 0 || ly < 0 || lx > el.width || ly > el.height) return false
  if (el.type === 'panel' && el.points) {
    const poly: Pt[] = []
    for (let i = 0; i < el.points.length; i += 2) poly.push({ x: el.points[i] * el.width, y: el.points[i + 1] * el.height })
    return pointInPolygon({ x: lx, y: ly }, poly)
  }
  return true
}

export function panelAt(p: Pt): PanelElement | undefined {
  const page = currentPage()
  if (!page) return undefined
  for (let i = page.elements.length - 1; i >= 0; i--) {
    const el = page.elements[i]
    if (el.type === 'panel' && !el.hidden && !el.locked && hitsElement(el, p)) return el
  }
  return undefined
}

export function fillPanel(panelId: string, asset: Asset) {
  const s = useEditor.getState()
  const panel = currentPage()?.elements.find((e) => e.id === panelId)
  if (!panel || panel.type !== 'panel') return
  const fit = coverFit(panel, asset)
  s.updateElement(panelId, (el) => {
    if (el.type !== 'panel') return
    el.image = { assetId: asset.id, ...fit, filters: el.image?.filters ?? { ...DEFAULT_FILTERS } }
  })
  s.select([panelId])
}

/** Suelta un recurso en la página: si cae sobre una viñeta la rellena, si no crea una imagen libre. */
export function placeAsset(asset: Asset, at?: Pt, opts: { intoPanel?: boolean } = {}) {
  const s = useEditor.getState()
  const project = s.project
  if (!project) return
  const { width: W, height: H } = project.format
  const point = at ?? { x: W / 2, y: H / 2 }
  if (opts.intoPanel !== false) {
    const selectedPanel = !at ? currentPage()?.elements.find((e) => e.type === 'panel' && s.selection.length === 1 && s.selection[0] === e.id) : undefined
    const target = (selectedPanel as PanelElement | undefined) ?? (at ? panelAt(point) : undefined)
    if (target) {
      fillPanel(target.id, asset)
      return
    }
  }
  const k = Math.min(1, (W * 0.6) / asset.width, (H * 0.6) / asset.height)
  const w = Math.round(asset.width * k)
  const h = Math.round(asset.height * k)
  const img = createImage(asset.id, Math.round(point.x - w / 2), Math.round(point.y - h / 2), w, h, asset.name)
  s.addElements([img])
}

export async function importFiles(files: File[] | FileList): Promise<Asset[]> {
  const s = useEditor.getState()
  const out: Asset[] = []
  for (const f of Array.from(files)) {
    if (!f.type.startsWith('image/')) {
      s.toast(`"${f.name}" no es una imagen`, 'error')
      continue
    }
    try {
      const asset = await importImageFile(f, f.name)
      s.addAsset(asset)
      out.push(asset)
    } catch {
      s.toast(`No se pudo leer "${f.name}"`, 'error')
    }
  }
  if (out.length) s.toast(out.length === 1 ? 'Imagen agregada a Recursos' : `${out.length} imágenes agregadas a Recursos`, 'success')
  return out
}
