import { create } from 'zustand'
import { produce, type Draft } from 'immer'
import type { Asset, BrushSettings, ComicElement, Page, Project, Tool } from '../types'
import { clonePage, cloneElement, createPage } from '../lib/factories'
import { buildTemplatePanels, TEMPLATES } from '../lib/templates'
import { measureTextHeight } from '../lib/textFit'
import { enqueueSave } from '../lib/persistence'

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
  clipboard: ComicElement[]
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
  paste(): void
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
  clipboard: [],
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
    set({ project: null, pageId: '', selection: [], past: [], future: [], saveStatus: 'saved', readerOpen: false })
  },

  setPage: (id) => set({ pageId: id, selection: [], croppingPanelId: null, editingTextId: null, fitRequest: get().fitRequest + 1 }),

  mutate: (recipe, opts = {}) => {
    const { project, past, lastCoalesce } = get()
    if (!project) return
    const next = produce(project, (d) => {
      recipe(d)
      d.updatedAt = Date.now()
    })
    if (next === project) return
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
    get().mutate((d) => {
      const page = d.pages.find((p) => p.id === pageId)
      if (page) page.elements = page.elements.filter((e) => !selection.includes(e.id) || e.locked)
    })
    set({ selection: [], croppingPanelId: null })
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
    const { selection } = get()
    if (!page || !selection.length) return
    set({ clipboard: page.elements.filter((e) => selection.includes(e.id)).map((e) => structuredClone(e)) })
    get().toast(`${selection.length} elemento(s) copiado(s)`)
  },

  paste: () => {
    const { clipboard } = get()
    if (!clipboard.length) return
    get().addElements(clipboard.map((e) => cloneElement(e)))
  },

  arrange: (dir) => {
    const { selection, pageId } = get()
    if (!selection.length) return
    get().mutate((d) => {
      const page = d.pages.find((p) => p.id === pageId)
      if (!page) return
      const els = page.elements
      const picked = els.filter((e) => selection.includes(e.id))
      const rest = els.filter((e) => !selection.includes(e.id))
      if (dir === 'front') page.elements = [...rest, ...picked]
      else if (dir === 'back') page.elements = [...picked, ...rest]
      else {
        const order = dir === 'forward' ? [...els.keys()].reverse() : [...els.keys()]
        for (const i of order) {
          if (!selection.includes(els[i].id)) continue
          const j = dir === 'forward' ? i + 1 : i - 1
          if (j < 0 || j >= els.length || selection.includes(els[j].id)) continue
          ;[els[i], els[j]] = [els[j], els[i]]
        }
      }
    })
  },

  reorderElement: (id, toIndex) =>
    get().mutate((d) => {
      const page = d.pages.find((p) => p.id === get().pageId)
      if (!page) return
      const from = page.elements.findIndex((e) => e.id === id)
      if (from < 0) return
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
      if (to < 0 || to >= d.pages.length) return
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
  removeAsset: (id) => get().mutate((d) => void (d.assets = d.assets.filter((a) => a.id !== id)), { history: false }),

  toast: (message, tone = 'info', action) => {
    const id = ++toastSeq
    set({ toasts: [...get().toasts, { id, message, tone, action }] })
    setTimeout(() => get().dismissToast(id), action ? 10000 : 3200)
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))

/** Al cambiar o cerrar el proyecto, lo que quedó sin guardar se escribe enseguida (sin esperar el debounce). */
function flushOnLeave() {
  const { project, saveStatus, revision } = useEditor.getState()
  if (!project || saveStatus === 'saved') return
  enqueueSave(project, revision).catch((e) => {
    console.error(e)
    useEditor.getState().toast(`No se pudieron guardar los últimos cambios de "${project.title}".`, 'error')
  })
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
