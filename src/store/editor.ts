import { create } from 'zustand'
import { produce, type Draft } from 'immer'
import type { Asset, BrushSettings, ComicElement, Page, Project, Tool } from '../types'
import { clonePage, cloneElement, createPage } from '../lib/factories'
import { buildTemplatePanels, TEMPLATES } from '../lib/templates'
import { measureTextHeight } from '../lib/textFit'
import { enqueueSave, enqueueTask } from '../lib/persistence'
import { deleteBlobsIfUnused, getAssetBlob, putAssetBlob } from '../lib/storage'
import { forgetAsset } from '../lib/assetCache'
import { referencedAssetIds } from '../lib/projectSchema'
import { uid } from '../lib/id'

const HISTORY_LIMIT = 120
const TEXT_KEYS = ['text', 'fontSize', 'fontFamily', 'fontStyle', 'lineHeight', 'letterSpacing', 'width', 'uppercase']
const COALESCE_MS = 700

type Snapshot = Omit<Project, 'assets' | 'thumbnail'>

export type SaveStatus = 'saved' | 'dirty' | 'saving' | 'error'

export interface Toast {
  id: number
  message: string
  tone: 'info' | 'success' | 'error'
  action?: { label: string; run: () => void }
}

/** Lo copiado: los elementos y la información de las imágenes que usan, para poder pegarlos en otro proyecto. */
export interface ClipboardData {
  projectId: string
  elements: ComicElement[]
  /** Páginas completas copiadas (Vista general). */
  pages?: Page[]
  assets: Asset[]
}

interface ViewOptions {
  guides: boolean
  grid: boolean
  snap: boolean
}

interface EditorState {
  project: Project | null
  pageId: string
  selection: string[]
  tool: Tool
  brush: BrushSettings
  view: ViewOptions
  zoom: number
  /** Viñeta en modo "encuadrar imagen". */
  croppingPanelId: string | null
  editingTextId: string | null
  clipboard: ClipboardData | null
  /**
   * Recursos quitados del proyecto en esta sesión. Su imagen no se borra enseguida: deshacer puede
   * volver a necesitarla. Se recolectan al salir del proyecto (ver collectRetiredAssets).
   */
  retiredAssets: Asset[]
  saveStatus: SaveStatus
  /** Sube con cada cambio del documento; sirve para no marcar "Guardado" con datos viejos. */
  revision: number
  /** Con el lector abierto el editor no recibe atajos. */
  readerOpen: boolean
  past: Snapshot[]
  future: Snapshot[]
  lastCoalesce: { key: string; at: number } | null
  toasts: Toast[]
  /** Cambia cada vez que el canvas pide encajar la página en pantalla. */
  fitRequest: number

  openProject(p: Project): void
  closeProject(): void
  setPage(id: string): void
  mutate(recipe: (d: Draft<Project>) => void, opts?: { coalesce?: string; history?: boolean }): void
  undo(): void
  redo(): void

  select(ids: string[]): void
  toggleSelect(id: string): void
  setTool(t: Tool): void
  setBrush(b: Partial<BrushSettings>): void
  setView(v: Partial<ViewOptions>): void
  setZoom(z: number): void
  requestFit(): void
  setCropping(id: string | null): void
  setEditingText(id: string | null): void
  setSaveStatus(s: SaveStatus): void
  /** Guarda ya el estado actual si tiene cambios. Devuelve false si falló. */
  saveNow(): Promise<boolean>
  setReaderOpen(open: boolean): void

  updateElement(id: string, patch: Partial<ComicElement> | ((el: Draft<ComicElement>) => void), coalesce?: string): void
  addElements(els: ComicElement[], opts?: { select?: boolean; index?: number }): void
  deleteSelection(): void
  duplicateSelection(): void
  copySelection(): void
  paste(): Promise<void>
  copyPages(ids: string[]): void
  pastePages(afterId?: string): Promise<void>
  arrange(dir: 'front' | 'back' | 'forward' | 'backward'): void
  reorderElement(id: string, toIndex: number): void

  addPage(templateId?: string, afterId?: string): void
  duplicatePage(id: string): void
  deletePage(id: string): void
  movePage(from: number, to: number): void
  applyTemplate(templateId: string, margin: number, gutter: number, mode: 'replace' | 'add'): void

  addAsset(a: Asset): void
  removeAsset(id: string): void

  toast(message: string, tone?: Toast['tone'], action?: Toast['action']): void
  dismissToast(id: number): void
}

const snapshotOf = (p: Project): Snapshot => {
  const { assets: _a, thumbnail: _t, ...rest } = p
  return rest
}

let toastSeq = 0

export const useEditor = create<EditorState>()((set, get) => ({
  project: null,
  pageId: '',
  selection: [],
  tool: 'select',
  brush: { kind: 'ink', color: '#111111', size: 6, opacity: 1, eraserSize: 30 },
  view: { guides: true, grid: false, snap: true },
  zoom: 1,
  croppingPanelId: null,
  editingTextId: null,
  clipboard: null,
  retiredAssets: [],
  saveStatus: 'saved',
  revision: 0,
  readerOpen: false,
  past: [],
  future: [],
  lastCoalesce: null,
  toasts: [],
  fitRequest: 0,

  openProject: (p) => {
    flushOnLeave()
    set({
      retiredAssets: [],
      project: p,
      pageId: p.pages[0]?.id ?? '',
      selection: [],
      past: [],
      future: [],
      saveStatus: 'saved',
      tool: 'select',
      croppingPanelId: null,
      editingTextId: null,
      fitRequest: get().fitRequest + 1,
      readerOpen: false,
    })
  },
  closeProject: () => {
    flushOnLeave()
    set({ project: null, pageId: '', selection: [], past: [], future: [], saveStatus: 'saved', readerOpen: false, retiredAssets: [] })
  },

  setPage: (id) => set({ pageId: id, selection: [], croppingPanelId: null, editingTextId: null, fitRequest: get().fitRequest + 1 }),

  mutate: (recipe, opts = {}) => {
    const { project, past, lastCoalesce } = get()
    if (!project) return
    // Primero se ve si el documento cambió de verdad; recién después se sella la hora.
    // Una acción sin efecto no entra al historial, no borra "Rehacer" ni marca cambios.
    const changed = produce(project, recipe)
    if (changed === project) return
    const next = { ...changed, updatedAt: Date.now() }
    const now = Date.now()
    const record = opts.history !== false
    const coalesced = record && opts.coalesce && lastCoalesce?.key === opts.coalesce && now - lastCoalesce.at < COALESCE_MS
    set({
      project: next,
      saveStatus: 'dirty',
      revision: get().revision + 1,
      past: record && !coalesced ? [...past, snapshotOf(project)].slice(-HISTORY_LIMIT) : past,
      future: record ? [] : get().future,
      lastCoalesce: opts.coalesce ? { key: opts.coalesce, at: now } : null,
    })
  },

  undo: () => {
    const { project, past, future } = get()
    if (!project || past.length === 0) return
    const prev = past[past.length - 1]
    set({
      project: { ...prev, assets: project.assets, thumbnail: project.thumbnail },
      past: past.slice(0, -1),
      future: [snapshotOf(project), ...future],
      saveStatus: 'dirty',
      revision: get().revision + 1,
      lastCoalesce: null,
      croppingPanelId: null,
      editingTextId: null,
    })
    fixupAfterHistory()
    restoreRetiredAssets()
  },
  redo: () => {
    const { project, past, future } = get()
    if (!project || future.length === 0) return
    const next = future[0]
    set({
      project: { ...next, assets: project.assets, thumbnail: project.thumbnail },
      past: [...past, snapshotOf(project)],
      future: future.slice(1),
      saveStatus: 'dirty',
      revision: get().revision + 1,
      lastCoalesce: null,
    })
    fixupAfterHistory()
    restoreRetiredAssets()
  },

  select: (ids) => set({ selection: ids, croppingPanelId: get().croppingPanelId && ids.includes(get().croppingPanelId!) ? get().croppingPanelId : null }),
  toggleSelect: (id) => {
    const sel = get().selection
    set({ selection: sel.includes(id) ? sel.filter((s) => s !== id) : [...sel, id] })
  },
  setTool: (t) => set({ tool: t, croppingPanelId: null, editingTextId: null, selection: t === 'brush' || t === 'eraser' ? get().selection.filter((id) => findEl(id)?.type === 'drawing') : get().selection }),
  setBrush: (b) => set({ brush: { ...get().brush, ...b } }),
  setView: (v) => set({ view: { ...get().view, ...v } }),
  setZoom: (z) => set({ zoom: z }),
  requestFit: () => set({ fitRequest: get().fitRequest + 1 }),
  setCropping: (id) => set({ croppingPanelId: id, selection: id ? [id] : get().selection }),
  setEditingText: (id) => set({ editingTextId: id }),
  setSaveStatus: (s) => set({ saveStatus: s }),
  saveNow: async () => {
    const { project, revision, saveStatus } = get()
    if (!project || saveStatus === 'saved') return true
    set({ saveStatus: 'saving' })
    try {
      await enqueueSave(project, revision)
      const now = get()
      if (now.project?.id === project.id && now.revision === revision) set({ saveStatus: 'saved' })
      return true
    } catch (e) {
      console.error(e)
      const now = get()
      if (now.project?.id === project.id) {
        // Queda marcado como no guardado: el próximo cambio o "Reintentar" lo vuelve a intentar.
        set({ saveStatus: 'error' })
        get().toast('No se pudo guardar. ¿El navegador se quedó sin espacio?', 'error', { label: 'Reintentar', run: () => void get().saveNow() })
      }
      return false
    }
  },
  setReaderOpen: (open) => set({ readerOpen: open }),

  updateElement: (id, patch, coalesce) =>
    get().mutate(
      (d) => {
        for (const page of d.pages) {
          const el = page.elements.find((e) => e.id === id)
          if (el) {
            if (typeof patch === 'function') patch(el)
            else Object.assign(el, patch)
            // Los textos horizontales crecen solos para no cortar líneas.
            if (el.type === 'text' && !el.vertical && typeof patch !== 'function' && TEXT_KEYS.some((k) => k in patch)) {
              const need = measureTextHeight(el)
              if (need > el.height) el.height = need
            }
            return
          }
        }
      },
      { coalesce: coalesce ? `${coalesce}:${id}` : undefined },
    ),

  addElements: (els, opts = {}) => {
    const { pageId } = get()
    get().mutate((d) => {
      const page = d.pages.find((p) => p.id === pageId)
      if (!page) return
      if (opts.index !== undefined) page.elements.splice(opts.index, 0, ...(els as Draft<ComicElement>[]))
      else page.elements.push(...(els as Draft<ComicElement>[]))
    })
    if (opts.select !== false) set({ selection: els.map((e) => e.id) })
  },

  deleteSelection: () => {
    const { selection, pageId } = get()
    if (!selection.length) return
    const sel = currentPage()?.elements.filter((e) => selection.includes(e.id)) ?? []
    const locked = sel.filter((e) => e.locked)
    if (locked.length) notifyLocked(locked.length)
    if (locked.length === sel.length) return
    get().mutate((d) => {
      const page = d.pages.find((p) => p.id === pageId)
      if (page) page.elements = page.elements.filter((e) => !selection.includes(e.id) || e.locked)
    })
    set({ selection: locked.map((e) => e.id), croppingPanelId: null })
  },

  duplicateSelection: () => {
    const page = currentPage()
    const { selection } = get()
    if (!page || !selection.length) return
    const copies = page.elements.filter((e) => selection.includes(e.id)).map((e) => cloneElement(e))
    get().addElements(copies)
  },

  copySelection: () => {
    const page = currentPage()
    const { selection, project } = get()
    if (!page || !project || !selection.length) return
    const elements = page.elements.filter((e) => selection.includes(e.id)).map((e) => structuredClone(e))
    const refs = referencedAssetIds([{ ...page, elements }])
    set({ clipboard: { projectId: project.id, elements, assets: project.assets.filter((a) => refs.has(a.id)).map((a) => ({ ...a })) } })
    get().toast(`${elements.length} elemento(s) copiado(s)`)
  },

  paste: async () => {
    const { clipboard, project } = get()
    if (!project || !clipboard) return
    if (!clipboard.elements.length && clipboard.pages?.length) return get().pastePages(get().pageId)
    if (!clipboard.elements.length) return
    const adopted = await adoptClipboardAssets(clipboard, project.id)
    if (!adopted) return
    const usable = clipboard.elements
      .map((e) => cloneElement(e))
      .filter((el) => !(el.type === 'image' && adopted.lost.has(el.assetId)))
      .map((el) => adopted.remap(el))
    if (usable.length) get().addElements(usable)
  },

  copyPages: (ids) => {
    const { project } = get()
    if (!project) return
    const pages = project.pages.filter((p) => ids.includes(p.id)).map((p) => structuredClone(p))
    if (!pages.length) return
    const refs = referencedAssetIds(pages)
    set({ clipboard: { projectId: project.id, elements: [], pages, assets: project.assets.filter((a) => refs.has(a.id)).map((a) => ({ ...a })) } })
    get().toast(pages.length === 1 ? 'Página copiada' : `${pages.length} páginas copiadas`)
  },

  pastePages: async (afterId) => {
    const { clipboard, project } = get()
    if (!project || !clipboard?.pages?.length) return
    const adopted = await adoptClipboardAssets(clipboard, project.id)
    if (!adopted) return
    // Copia completa con ids nuevos: elementos, capas y referencias a imágenes válidas en este proyecto.
    const pages = clipboard.pages.map((pg) => {
      const copy = clonePage(pg)
      copy.name = pg.name
      copy.elements = copy.elements.filter((el) => !(el.type === 'image' && adopted.lost.has(el.assetId))).map((el) => adopted.remap(el))
      return copy
    })
    get().mutate((d) => {
      const idx = afterId ? d.pages.findIndex((p) => p.id === afterId) : -1
      d.pages.splice(idx >= 0 ? idx + 1 : d.pages.length, 0, ...(pages as Draft<Page>[]))
    })
    get().setPage(pages[0].id)
    get().toast(pages.length === 1 ? 'Página pegada' : `${pages.length} páginas pegadas`, 'success')
  },

  arrange: (dir) => {
    const { selection, pageId } = get()
    const pg = currentPage()
    if (!selection.length || !pg) return
    // Los bloqueados no cambian de lugar en la pila.
    const locked = pg.elements.filter((e) => selection.includes(e.id) && e.locked)
    if (locked.length) notifyLocked(locked.length)
    const movable = new Set(pg.elements.filter((e) => selection.includes(e.id) && !e.locked).map((e) => e.id))
    if (!movable.size) return
    const els = [...pg.elements]
    let order: ComicElement[]
    if (dir === 'front') order = [...els.filter((e) => !movable.has(e.id)), ...els.filter((e) => movable.has(e.id))]
    else if (dir === 'back') order = [...els.filter((e) => movable.has(e.id)), ...els.filter((e) => !movable.has(e.id))]
    else {
      order = els
      const idx = dir === 'forward' ? [...els.keys()].reverse() : [...els.keys()]
      for (const i of idx) {
        if (!movable.has(order[i].id)) continue
        const j = dir === 'forward' ? i + 1 : i - 1
        if (j < 0 || j >= order.length || movable.has(order[j].id)) continue
        ;[order[i], order[j]] = [order[j], order[i]]
      }
    }
    if (order.every((e, i) => e === pg.elements[i])) return
    const ids = order.map((e) => e.id)
    get().mutate((d) => {
      const page = d.pages.find((p) => p.id === pageId)
      if (page) page.elements = ids.map((id) => page.elements.find((e) => e.id === id)!)
    })
  },

  reorderElement: (id, toIndex) =>
    get().mutate((d) => {
      const page = d.pages.find((p) => p.id === get().pageId)
      if (!page) return
      const from = page.elements.findIndex((e) => e.id === id)
      const to = Math.max(0, Math.min(toIndex, page.elements.length - 1))
      if (from < 0 || from === to) return
      const [el] = page.elements.splice(from, 1)
      page.elements.splice(Math.max(0, Math.min(toIndex, page.elements.length)), 0, el)
    }),

  addPage: (templateId, afterId) => {
    const { project } = get()
    if (!project) return
    const page = createPage(`Página ${project.pages.length + 1}`, project.format, templateId)
    get().mutate((d) => {
      const idx = afterId ? d.pages.findIndex((p) => p.id === afterId) : -1
      if (idx >= 0) d.pages.splice(idx + 1, 0, page)
      else d.pages.push(page)
    })
    get().setPage(page.id)
  },

  duplicatePage: (id) => {
    const src = get().project?.pages.find((p) => p.id === id)
    if (!src) return
    const copy = clonePage(src)
    get().mutate((d) => {
      d.pages.splice(d.pages.findIndex((p) => p.id === id) + 1, 0, copy as Draft<Page>)
    })
    get().setPage(copy.id)
  },

  deletePage: (id) => {
    const { project, pageId } = get()
    if (!project || project.pages.length <= 1) {
      get().toast('El proyecto necesita al menos una página', 'error')
      return
    }
    const idx = project.pages.findIndex((p) => p.id === id)
    get().mutate((d) => {
      d.pages = d.pages.filter((p) => p.id !== id)
    })
    if (pageId === id) get().setPage(get().project!.pages[Math.max(0, idx - 1)].id)
  },

  movePage: (from, to) =>
    get().mutate((d) => {
      if (from === to || to < 0 || to >= d.pages.length) return
      const [p] = d.pages.splice(from, 1)
      d.pages.splice(to, 0, p)
    }),

  applyTemplate: (templateId, margin, gutter, mode) => {
    const { project, pageId } = get()
    const tpl = TEMPLATES.find((t) => t.id === templateId)
    if (!project || !tpl) return
    const panels = buildTemplatePanels(tpl, project.format, margin, gutter)
    get().mutate((d) => {
      const page = d.pages.find((p) => p.id === pageId)
      if (!page) return
      if (mode === 'replace') {
        // Conserva las imágenes ya encuadradas en el mismo orden de viñetas.
        const oldPanels = page.elements.filter((e) => e.type === 'panel')
        panels.forEach((p, i) => {
          const old = oldPanels[i]
          if (old?.type === 'panel' && old.image) p.image = { ...old.image }
        })
        const others = page.elements.filter((e) => e.type !== 'panel')
        page.elements = [...(panels as Draft<ComicElement>[]), ...others]
      } else {
        page.elements.push(...(panels as Draft<ComicElement>[]))
      }
    })
    set({ selection: [] })
  },

  addAsset: (a) => get().mutate((d) => void d.assets.push(a), { history: false }),
  removeAsset: (id) => {
    const asset = get().project?.assets.find((a) => a.id === id)
    if (!asset) return
    set({ retiredAssets: [...get().retiredAssets.filter((a) => a.id !== id), asset] })
    get().mutate((d) => void (d.assets = d.assets.filter((a) => a.id !== id)), { history: false })
  },

  toast: (message, tone = 'info', action) => {
    const id = ++toastSeq
    set({ toasts: [...get().toasts, { id, message, tone, action }] })
    // Los errores y los avisos con acción duran más; todos se pueden cerrar.
    setTimeout(() => get().dismissToast(id), action ? 10000 : tone === 'error' ? 6000 : 3500)
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))

/** Al cambiar o cerrar el proyecto, lo que quedó sin guardar se escribe enseguida (sin esperar el debounce). */
function flushOnLeave() {
  const { project, saveStatus, revision } = useEditor.getState()
  if (!project) return
  if (saveStatus !== 'saved')
    enqueueSave(project, revision).catch((e) => {
      console.error(e)
      useEditor.getState().toast(`No se pudieron guardar los últimos cambios de "${project.title}".`, 'error')
    })
  collectRetiredAssets(project)
}

/**
 * Recolección de imágenes retiradas al salir del proyecto: el historial se descarta, así que sólo
 * quedan vivas las que usa el documento o el portapapeles. Corre después del guardado (misma cola)
 * y nunca borra un blob que otro proyecto guardado todavía lista.
 */
function collectRetiredAssets(project: Project) {
  const { retiredAssets, clipboard } = useEditor.getState()
  if (!retiredAssets.length) return
  const alive = referencedAssetIds(project.pages)
  for (const a of project.assets) alive.add(a.id)
  for (const a of clipboard?.assets ?? []) alive.add(a.id)
  const candidates = retiredAssets.map((a) => a.id).filter((id) => !alive.has(id))
  void enqueueTask(async () => {
    const gone = await deleteBlobsIfUnused(candidates)
    gone.forEach(forgetAsset)
  }).catch((e) => console.error('[recolección de imágenes]', e))
}

/** Si deshacer/rehacer vuelve a usar una imagen retirada, el recurso vuelve al proyecto. */
function restoreRetiredAssets() {
  const { project, retiredAssets } = useEditor.getState()
  if (!project || !retiredAssets.length) return
  const have = new Set(project.assets.map((a) => a.id))
  const refs = referencedAssetIds(project.pages)
  const back = retiredAssets.filter((a) => refs.has(a.id) && !have.has(a.id))
  if (!back.length) return
  useEditor.setState({ retiredAssets: retiredAssets.filter((a) => !back.includes(a)) })
  useEditor.getState().mutate((d) => void d.assets.push(...back), { history: false })
}

/**
 * Trae al proyecto actual las imágenes que usa lo copiado y que el proyecto no tiene (copiadas de otro
 * proyecto): se duplica cada blob con id propio. Así nada pegado apunta a un recurso ausente y el
 * .vineta queda autocontenido. Las imágenes que ya no existen se informan en `lost`.
 */
async function adoptClipboardAssets(clipboard: ClipboardData, projectId: string) {
  const s = useEditor.getState()
  const have = new Set(s.project?.assets.map((a) => a.id))
  const missing = clipboard.assets.filter((a) => !have.has(a.id))
  const map = new Map<string, string>()
  const added: Asset[] = []
  const written: string[] = []
  const lost = new Set<string>()
  try {
    for (const a of missing) {
      const blob = await getAssetBlob(a.id)
      if (!blob) {
        lost.add(a.id)
        continue
      }
      const nid = uid('as_')
      await putAssetBlob(nid, blob)
      written.push(nid)
      map.set(a.id, nid)
      added.push({ ...a, id: nid, createdAt: Date.now() })
    }
  } catch (e) {
    console.error(e)
    void deleteBlobsIfUnused(written)
    s.toast('No se pudieron copiar las imágenes. ¿El navegador se quedó sin espacio?', 'error')
    return null
  }
  if (useEditor.getState().project?.id !== projectId) {
    void deleteBlobsIfUnused(written)
    return null
  }
  if (lost.size) s.toast('Algunas imágenes copiadas ya no existen y no se pegaron.', 'error')
  if (added.length) useEditor.getState().mutate((d) => void d.assets.push(...added), { history: false })
  const remap = <T extends ComicElement>(el: T): T => {
    if (el.type === 'image') return { ...el, assetId: map.get(el.assetId) ?? el.assetId }
    if (el.type === 'panel' && el.image) return { ...el, image: lost.has(el.image.assetId) ? null : { ...el.image, assetId: map.get(el.image.assetId) ?? el.image.assetId } }
    return el
  }
  return { lost, remap }
}

/** Aviso corto cuando una operación deja afuera elementos bloqueados. */
export function notifyLocked(n: number) {
  useEditor.getState().toast(n === 1 ? 'Se omitió 1 elemento bloqueado' : `Se omitieron ${n} elementos bloqueados`)
}

function fixupAfterHistory() {
  const s = useEditor.getState()
  if (!s.project) return
  const page = s.project.pages.find((p) => p.id === s.pageId)
  if (!page) {
    useEditor.setState({ pageId: s.project.pages[0].id, selection: [] })
    return
  }
  const ids = new Set(page.elements.map((e) => e.id))
  useEditor.setState({ selection: s.selection.filter((id) => ids.has(id)) })
}

export function currentPage(): Page | undefined {
  const { project, pageId } = useEditor.getState()
  return project?.pages.find((p) => p.id === pageId)
}

export function findEl(id: string): ComicElement | undefined {
  return currentPage()?.elements.find((e) => e.id === id)
}

export function useCurrentPage(): Page | undefined {
  return useEditor((s) => s.project?.pages.find((p) => p.id === s.pageId))
}

export function useSelectedElements(): ComicElement[] {
  const page = useCurrentPage()
  const selection = useEditor((s) => s.selection)
  return page ? page.elements.filter((e) => selection.includes(e.id)) : []
}
