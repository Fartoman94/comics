import type { Asset, ComicElement, PanelElement } from '../types'
import { DEFAULT_FILTERS } from '../types'
import { coverFit } from './imageFit'
import { createImage } from './factories'
import { pointInPolygon, rotatePoint, type Pt } from './geometry'
import { addLibraryImage, findLibraryImageByHash, getAssetBlob, hashBlob, importImageFile, updateLibraryItem } from './storage'
import { currentPage, useEditor } from '../store/editor'
import { validateImageFile } from './imageValidation'

export { containFit, coverFit } from './imageFit'

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
  // Reemplazar conserva filtros, giro y espejos; el encuadre se recalcula para la imagen nueva.
  const prev = panel.image
  const fit = coverFit(panel, asset, prev?.rotation)
  s.updateElement(panelId, (el) => {
    if (el.type !== 'panel') return
    el.image = {
      assetId: asset.id,
      ...fit,
      filters: prev?.filters ? { ...prev.filters } : { ...DEFAULT_FILTERS },
      ...(prev?.rotation ? { rotation: prev.rotation } : {}),
      ...(prev?.flipX ? { flipX: true } : {}),
      ...(prev?.flipY ? { flipY: true } : {}),
    }
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

export interface ImportProgress {
  done: number
  total: number
  current?: string
}

/**
 * Suma imágenes al proyecto. Si la misma imagen (misma huella) ya está en el proyecto o en la
 * biblioteca, se reutiliza en vez de duplicarla. Las nuevas también quedan en la biblioteca.
 * Cada archivo se valida por su contenido real (PNG, JPG, WebP o GIF) y tamaño máximo.
 * `signal` cancela entre archivos (lo ya importado queda); `onProgress` informa el avance.
 */
export async function importFiles(
  files: File[] | FileList,
  opts: { onProgress?: (p: ImportProgress) => void; signal?: AbortSignal; onError?: (reason: string) => void; quiet?: boolean } = {},
): Promise<Asset[]> {
  const s = useEditor.getState()
  const list = Array.from(files)
  const out: Asset[] = []
  let reused = 0
  const fail = (reason: string) => (opts.onError ? opts.onError(reason) : s.toast(reason, 'error'))
  for (const [i, f] of list.entries()) {
    if (opts.signal?.aborted) break
    opts.onProgress?.({ done: i, total: list.length, current: f.name })
    const check = await validateImageFile(f)
    if (!check.ok) {
      fail(check.reason)
      continue
    }
    try {
      const hash = await hashBlob(f).catch(() => undefined)
      const project = useEditor.getState().project
      const inProject = hash ? project?.assets.find((a) => a.hash === hash) : undefined
      if (inProject) {
        reused++
        out.push(inProject)
        continue
      }
      const inLibrary = hash ? await findLibraryImageByHash(hash) : undefined
      if (inLibrary && (await getAssetBlob(inLibrary.asset.id))) {
        const asset = { ...inLibrary.asset }
        s.addAsset(asset)
        void updateLibraryItem(inLibrary.id, { lastUsedAt: Date.now() })
        reused++
        out.push(asset)
        continue
      }
      // Se usa el tipo real (un .png que en realidad es JPG se trata como JPG).
      const real = f.type === check.mime ? f : new Blob([f], { type: check.mime })
      const asset = await importImageFile(real, f.name, hash)
      if (opts.signal?.aborted) break
      s.addAsset(asset)
      if (project) void addLibraryImage(asset, { id: project.id, title: project.title }).catch(() => undefined)
      out.push(asset)
    } catch (e) {
      console.error(e)
      fail(`No se pudo leer "${f.name}" (¿está dañada?)`)
    }
  }
  opts.onProgress?.({ done: list.length, total: list.length })
  if (opts.quiet) return out
  if (reused) s.toast(reused === 1 ? 'Esa imagen ya estaba: se reutilizó sin duplicarla' : `${reused} imágenes ya estaban: se reutilizaron`, 'info')
  else if (out.length) s.toast(out.length === 1 ? 'Imagen agregada a Recursos' : `${out.length} imágenes agregadas a Recursos`, 'success')
  return out
}
