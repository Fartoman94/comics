import { create } from 'zustand'
import { produce, type Draft } from 'immer'
import type { Asset, BrushSettings, ComicElement, Page, Project, ScriptBlock, ScriptKind, Tool } from '../types'
import { clonePage, cloneElement, createBubble, createPage, createPanel, createText, TEXT_PRESETS } from '../lib/factories'
import { fitBubbleSize } from '../lib/bubbleFit'
import { buildTemplatePanels, TEMPLATES } from '../lib/templates'
import { measureTextHeight } from '../lib/textFit'
import { enqueueSave, enqueueTask } from '../lib/persistence'
import { deleteBlobsIfUnused, getAssetBlob, putAssetBlob, takeSnapshot } from '../lib/storage'
import { clearSaveFailed, markSaveFailed } from '../lib/saveMarks'
import { forgetAsset } from '../lib/assetCache'
import { referencedAssetIds } from '../lib/projectSchema'
import { uid } from '../lib/id'
import type { HistorySnapshot } from '../lib/history'
import { clearRescue } from '../lib/rescue'
import { findFreeSpot, intersect } from '../lib/freeSpot'
import { splitPanel as splitPanelGeometry, type SplitDirection } from '../lib/panelOps'

const HISTORY_LIMIT = 120
const TEXT_KEYS = ['text', 'fontSize', 'fontFamily', 'fontStyle', 'lineHeight', 'letterSpacing', 'width', 'uppercase']
const COALESCE_MS = 700

type Snapshot = HistorySnapshot

export type SaveStatus = 'saved' | 'dirty' | 'saving' | 'error'

/** Estilo de diseño aplicable en bloque (bordes, radio y tipografía), separado de las plantillas (estructura). */
export interface DesignStyle {
  panelStroke?: string
  panelStrokeWidth?: number
  panelRadius?: number
  bubbleFont?: string
  bubbleStroke?: string
}

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
  /** Solo lectura: el proyecto se está editando en otra pestaña. No se modifica ni se guarda. */
  readOnly: boolean
  setReadOnly(v: boolean): void
  past: Snapshot[]
  future: Snapshot[]
  lastCoalesce: { key: string; at: number } | null
  toasts: Toast[]
  /** Sube con cada operación crítica (borrar, páginas, plantillas): se guarda enseguida, sin esperar. */
  urgentSave: number
  /** Cambia cada vez que el canvas pide encajar la página en pantalla. */
  fitRequest: number
  /** Cómo encajar: la página entera o a lo ancho. */
  fitMode: 'page' | 'width'
  /** Parte de la página que se ve en pantalla (coordenadas de página). */
  visibleRect: { x: number; y: number; width: number; height: number } | null

  openProject(p: Project): void
  closeProject(): void
  setPage(id: string): void
  mutate(recipe: (d: Draft<Project>) => void, opts?: { coalesce?: string; history?: boolean; urgent?: boolean }): void
  undo(): void
  redo(): void
  /** Salta en el historial: negativo deshace n pasos, positivo rehace n. */
  jumpHistory(steps: number): void

  select(ids: string[]): void
  toggleSelect(id: string): void
  setTool(t: Tool): void
  setBrush(b: Partial<BrushSettings>): void
  setView(v: Partial<ViewOptions>): void
  setZoom(z: number): void
  requestFit(mode?: 'page' | 'width'): void
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
  /** Duplica una viñeta con todo lo que tiene encima (globos, textos, imágenes, efectos) en una sola acción. */
  duplicatePanelWithContent(panelId: string): void
  /** Página nueva con las mismas viñetas, sin contenido ni imágenes. */
  duplicatePageStructure(pageId: string): void
  /** Aplica una página (plantilla propia) reemplazando la actual o como página nueva. Copia sus imágenes. */
  applyPageTemplate(page: Page, assets: Asset[], mode: 'replace' | 'new'): Promise<void>
  // Guion
  addScriptBlock(pageId: string, panelId: string | null, kind: ScriptKind, text?: string): string
  updateScriptBlock(pageId: string, blockId: string, patch: Partial<Pick<ScriptBlock, 'kind' | 'text' | 'character'>>): void
  removeScriptBlock(pageId: string, blockId: string): void
  moveScriptBlock(pageId: string, blockId: string, dir: -1 | 1): void
  placeScriptBlock(pageId: string, blockId: string): void
  /** Coloca de una vez todos los bloques pendientes del guion de la página (en sus viñetas). Devuelve cuántos. */
  placePageScript(pageId: string): number
  /** Agranda o achica un globo para que su texto entre cómodo. */
  fitBubbleToText(id: string): void
  /** Portada: imagen a página completa, título, bajada y autor/a (sobre la página actual o una nueva). */
  applyCoverTemplate(mode: 'replace' | 'new'): void
  /** Resuelve una divergencia: 'page' = el guion toma el texto de la página; 'script' = la página toma el del guion. */
  syncScriptBlock(pageId: string, blockId: string, from: 'page' | 'script'): void
  pastePages(afterId?: string): Promise<void>
  arrange(dir: 'front' | 'back' | 'forward' | 'backward'): void
  /** Divide una viñeta en dos (con medianil). Devuelve false si quedaría demasiado chica o está bloqueada. */
  splitPanel(id: string, dir: SplitDirection): boolean
  reorderElement(id: string, toIndex: number): void

  addPage(templateId?: string, afterId?: string): void
  renamePage(id: string, name: string): void
  /** Diseño (no estructura): aplica estilos a las viñetas y globos de la página actual o de todo el proyecto. */
  applyDesign(style: DesignStyle, scope: 'page' | 'project'): void
  /** Copia el contenido de una página (con ids nuevos) al final de otras páginas del proyecto. */
  copyPageContentTo(srcId: string, destIds: string[]): void
  /** Va a la página n (0 = primera); se ajusta al rango. */
  goToPage(index: number): void
  duplicatePage(id: string): void
  deletePage(id: string): void
  movePage(from: number, to: number): void
  applyTemplate(templateId: string, margin: number, gutter: number, mode: 'replace' | 'add'): void
  /** Página nueva (después de la actual) armada con la plantilla, en una sola acción. */
  addPageFromTemplate(templateId: string, margin: number, gutter: number): void

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
  readOnly: false,
  setReadOnly: (v) => set({ readOnly: v }),
  past: [],
  future: [],
  lastCoalesce: null,
  toasts: [],
  urgentSave: 0,
  fitRequest: 0,
  fitMode: 'page',
  visibleRect: null,

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
      fitMode: 'page',
      readerOpen: false,
      readOnly: false,
    })
  },
  closeProject: () => {
    flushOnLeave()
    set({ project: null, pageId: '', selection: [], past: [], future: [], saveStatus: 'saved', readerOpen: false, retiredAssets: [] })
  },

  setPage: (id) => set({ pageId: id, selection: [], croppingPanelId: null, editingTextId: null, fitRequest: get().fitRequest + 1 }),

  mutate: (recipe, opts = {}) => {
    const { project, past, lastCoalesce, readOnly } = get()
    if (!project) return
    // En solo lectura no se modifica nada (los cambios automáticos, como la miniatura, se ignoran en silencio).
    if (readOnly) return opts.history === false ? undefined : notifyReadOnly()
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
      urgentSave: opts.urgent ? get().urgentSave + 1 : get().urgentSave,
    })
  },

  undo: () => {
    const { project, past, future } = get()
    if (!project || past.length === 0) return
    if (get().readOnly) return notifyReadOnly()
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
    if (get().readOnly) return notifyReadOnly()
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

  jumpHistory: (steps) => {
    const n = Math.abs(Math.round(steps))
    for (let i = 0; i < n; i++) {
      const { past, future } = get()
      if (steps < 0 ? !past.length : !future.length) break
      if (steps < 0) get().undo()
      else get().redo()
    }
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
  requestFit: (mode = 'page') => set({ fitRequest: get().fitRequest + 1, fitMode: mode }),
  setCropping: (id) => set({ croppingPanelId: id, selection: id ? [id] : get().selection }),
  setEditingText: (id) => set({ editingTextId: id }),
  setSaveStatus: (s) => set({ saveStatus: s }),
  saveNow: async () => {
    const { project, revision, saveStatus, readOnly } = get()
    if (!project || saveStatus === 'saved' || readOnly) return true
    set({ saveStatus: 'saving' })
    try {
      await enqueueSave(project, revision)
      clearSaveFailed(project.id)
      if (get().revision === revision) clearRescue(project.id)
      // Instantánea local acotada (como mucho una cada 5 minutos por proyecto).
      void takeSnapshot(project).catch(() => undefined)
      const now = get()
      if (now.project?.id === project.id && now.revision === revision) set({ saveStatus: 'saved' })
      return true
    } catch (e) {
      console.error(e)
      markSaveFailed(project.id)
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
    }, { urgent: true })
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

  duplicatePanelWithContent: (panelId) => {
    const page = currentPage()
    const panel = page?.elements.find((e) => e.id === panelId)
    if (!page || !panel || panel.type !== 'panel') return
    // Contenido = lo que está por encima de la viñeta y con su centro adentro.
    const at = page.elements.indexOf(panel)
    const inside = page.elements.filter((e, i) => i > at && e.type !== 'panel' && e.type !== 'drawing' && centerIn(e, panel))
    const group = [panel, ...inside]
    const { width: W, height: H } = get().project!.format
    // Al lado si entra, si no abajo, si no un poco corrida: composición relativa intacta.
    const gap = Math.round(W * 0.018)
    const dx = panel.x + panel.width * 2 + gap <= W ? panel.width + gap : 0
    const dy = dx === 0 && panel.y + panel.height * 2 + gap <= H ? panel.height + gap : 0
    const [ox, oy] = dx || dy ? [dx, dy] : [24, 24]
    const copies = group.map((e) => {
      const c = cloneElement(e, 0)
      c.x += ox
      c.y += oy
      return c
    })
    get().addElements(copies)
  },

  duplicatePageStructure: (pageId) => {
    const src = get().project?.pages.find((p) => p.id === pageId)
    if (!src) return
    const copy = clonePage({ ...src, elements: src.elements.filter((e) => e.type === 'panel') })
    copy.name = `${src.name} (estructura)`
    copy.elements = copy.elements.map((e) => (e.type === 'panel' ? { ...e, image: null } : e))
    get().mutate((d) => {
      d.pages.splice(d.pages.findIndex((p) => p.id === pageId) + 1, 0, copy as Draft<Page>)
    }, { urgent: true })
    get().setPage(copy.id)
  },

  applyPageTemplate: async (page, assets, mode) => {
    const { project, pageId } = get()
    if (!project) return
    const adopted = await adoptClipboardAssets({ projectId: 'plantilla', elements: [], assets }, project.id)
    if (!adopted) return
    const fresh = clonePage(page)
    const elements = fresh.elements.filter((el) => !(el.type === 'image' && adopted.lost.has(el.assetId))).map((el) => adopted.remap(el))
    if (mode === 'new') {
      const created = { ...fresh, name: page.name || 'Página', elements }
      get().mutate((d) => {
        d.pages.splice(d.pages.findIndex((p) => p.id === pageId) + 1, 0, created as Draft<Page>)
      })
      get().setPage(created.id)
    } else {
      get().mutate((d) => {
        const pg = d.pages.find((p) => p.id === pageId)
        if (!pg) return
        pg.elements = elements as Draft<ComicElement>[]
        pg.background = page.background
      })
      set({ selection: [] })
    }
  },

  addScriptBlock: (pageId, panelId, kind, text = '') => {
    const blockId = uid('sb_')
    get().mutate((d) => {
      d.script ??= { pages: {} }
      const sp = (d.script.pages[pageId] ??= { panels: [] })
      let row = sp.panels.find((p) => p.panelId === panelId)
      if (!row) {
        row = { id: uid('sp_'), panelId, blocks: [] }
        sp.panels.push(row)
      }
      row.blocks.push({ id: blockId, kind, text })
    })
    return blockId
  },
  updateScriptBlock: (pageId, blockId, patch) =>
    get().mutate(
      (d) => {
        const b = findBlock(d.script, pageId, blockId)
        if (b) Object.assign(b, patch)
      },
      { coalesce: `guion:${blockId}` },
    ),
  removeScriptBlock: (pageId, blockId) =>
    get().mutate((d) => {
      for (const row of d.script?.pages[pageId]?.panels ?? []) row.blocks = row.blocks.filter((b) => b.id !== blockId)
    }, { urgent: true }),
  moveScriptBlock: (pageId, blockId, dir) =>
    get().mutate((d) => {
      for (const row of d.script?.pages[pageId]?.panels ?? []) {
        const i = row.blocks.findIndex((b) => b.id === blockId)
        const j = i + dir
        if (i >= 0 && j >= 0 && j < row.blocks.length) [row.blocks[i], row.blocks[j]] = [row.blocks[j], row.blocks[i]]
      }
    }),
  placeScriptBlock: (pageId, blockId) => {
    const { project } = get()
    const page = project?.pages.find((p) => p.id === pageId)
    const row = project?.script?.pages[pageId]?.panels.find((r) => r.blocks.some((b) => b.id === blockId))
    const block = row?.blocks.find((b) => b.id === blockId)
    if (!project || !page || !block || block.kind === 'description') return
    if (get().pageId !== pageId) get().setPage(pageId)
    const scale = project.format.width / 900
    let el: ComicElement
    if (block.kind === 'sfx') {
      const t = createText(0, 0, TEXT_PRESETS.find((p) => p.id.includes('sfx')) ?? TEXT_PRESETS[0])
      t.text = block.text
      t.fontSize = Math.round(t.fontSize * scale)
      el = t
    } else {
      const b = createBubble(block.kind === 'thought' ? 'thought' : block.kind === 'caption' ? 'box' : 'speech', 0, 0, scale)
      b.text = block.text
      el = b
    }
    // Dentro de la viñeta del guion (si existe todavía), en un lugar libre y visible.
    const panel = row?.panelId ? page.elements.find((e) => e.id === row.panelId && e.type === 'panel') : undefined
    if (panel) useEditor.setState({ selection: [panel.id] })
    Object.assign(el, placementFor(el.width, el.height))
    get().mutate((d) => {
      const pg = d.pages.find((p) => p.id === pageId)
      pg?.elements.push(el as Draft<ComicElement>)
      const b = findBlock(d.script, pageId, blockId)
      if (b) b.placedElementId = el.id
    })
    set({ selection: [el.id] })
  },
  placePageScript: (pageId) => {
    const pending = (get().project?.script?.pages[pageId]?.panels ?? []).flatMap((row) => row.blocks).filter((b) => b.kind !== 'description' && b.text.trim() && scriptStatus(get().project?.pages.find((p) => p.id === pageId), b) === 'pendiente')
    for (const b of pending) get().placeScriptBlock(pageId, b.id)
    for (const b of pending) {
      const placed = findBlock(get().project?.script, pageId, b.id)?.placedElementId
      const el = placed ? get().project?.pages.find((p) => p.id === pageId)?.elements.find((e) => e.id === placed) : undefined
      if (el?.type === 'bubble') get().fitBubbleToText(el.id)
    }
    return pending.length
  },

  fitBubbleToText: (id) => {
    const el = findEl(id) ?? get().project?.pages.flatMap((p) => p.elements).find((e) => e.id === id)
    if (el?.type !== 'bubble') return
    const size = fitBubbleSize(el, { maxWidth: get().project!.format.width * 0.6 })
    if (!size) return
    get().updateElement(id, (d) => {
      if (d.type !== 'bubble') return
      // La cola apunta al mismo lugar relativo.
      d.tailX = (d.tailX / d.width) * size.width
      d.tailY = d.tailY > d.height ? size.height + (d.tailY - d.height) : (d.tailY / d.height) * size.height
      d.width = size.width
      d.height = size.height
    })
  },

  applyCoverTemplate: (mode) => {
    const { project, pageId } = get()
    if (!project) return
    const { width: W, height: H } = project.format
    const panel = createPanel(0, 0, W, H)
    panel.name = 'Imagen de portada'
    panel.strokeWidth = 0
    panel.fill = '#1c1c22'
    const title = createText(Math.round(W * 0.06), Math.round(H * 0.06), TEXT_PRESETS.find((p) => p.id === 'title') ?? TEXT_PRESETS[0])
    Object.assign(title, { name: 'Título', text: project.title.toUpperCase() || 'TÍTULO', width: Math.round(W * 0.88), height: Math.round(H * 0.16), fontSize: Math.round(W * 0.11), textColor: '#ffffff', stroke: '#111111', strokeWidth: Math.round(W * 0.012) })
    const tagline = createText(Math.round(W * 0.08), Math.round(H * 0.22), TEXT_PRESETS.find((p) => p.id === 'caption') ?? TEXT_PRESETS[0])
    Object.assign(tagline, { name: 'Bajada', text: project.synopsis.split('.')[0] || 'Una historia original', width: Math.round(W * 0.84), height: Math.round(H * 0.06), fontSize: Math.round(W * 0.035), textColor: '#ffffff', strokeWidth: 0, shadow: true, shadowColor: '#000000' })
    const author = createText(Math.round(W * 0.08), Math.round(H * 0.9), TEXT_PRESETS.find((p) => p.id === 'caption') ?? TEXT_PRESETS[0])
    Object.assign(author, { name: 'Autor/a', text: project.author || 'Autor/a', width: Math.round(W * 0.84), height: Math.round(H * 0.05), fontSize: Math.round(W * 0.03), textColor: '#ffffff', strokeWidth: 0, align: 'right' as const })
    const elements = [panel, title, tagline, author]
    if (mode === 'new') {
      const page = createPage('Portada', project.format)
      page.elements = elements
      get().mutate((d) => void d.pages.splice(d.pages.findIndex((p) => p.id === pageId) + 1, 0, page as Draft<Page>), { urgent: true })
      get().setPage(page.id)
    } else {
      get().mutate((d) => {
        const pg = d.pages.find((p) => p.id === pageId)
        if (pg) pg.elements = elements as Draft<ComicElement>[]
      }, { urgent: true })
    }
  },

  syncScriptBlock: (pageId, blockId, from) =>
    get().mutate((d) => {
      const b = findBlock(d.script, pageId, blockId)
      const el = b?.placedElementId ? d.pages.find((p) => p.id === pageId)?.elements.find((e) => e.id === b.placedElementId) : undefined
      if (!b || !el || (el.type !== 'bubble' && el.type !== 'text')) return
      if (from === 'page') b.text = el.text
      else el.text = b.text
    }),

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
    }, { urgent: true })
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

  splitPanel: (id, dir) => {
    const { project, pageId } = get()
    const panel = currentPage()?.elements.find((e) => e.id === id)
    if (!project || !panel || panel.type !== 'panel') return false
    if (panel.locked) {
      notifyLocked(1)
      return false
    }
    const halves = splitPanelGeometry(panel, dir, Math.round(project.format.width * 0.018))
    if (!halves) {
      get().toast('La viñeta es demasiado chica para dividirla', 'error')
      return false
    }
    get().mutate((d) => {
      const page = d.pages.find((p) => p.id === pageId)
      const i = page?.elements.findIndex((e) => e.id === id) ?? -1
      if (!page || i < 0) return
      page.elements.splice(i, 1, ...(halves as Draft<ComicElement>[]))
    })
    set({ selection: [halves[0].id] })
    return true
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
    const page = createPage(nextPageName(project.pages), project.format, templateId)
    get().mutate((d) => {
      const idx = afterId ? d.pages.findIndex((p) => p.id === afterId) : -1
      if (idx >= 0) d.pages.splice(idx + 1, 0, page)
      else d.pages.push(page)
    }, { urgent: true })
    get().setPage(page.id)
  },

  applyDesign: (style, scope) => {
    const { pageId } = get()
    get().mutate((d) => {
      for (const pg of d.pages) {
        if (scope === 'page' && pg.id !== pageId) continue
        for (const el of pg.elements) {
          if (el.locked) continue
          if (el.type === 'panel') {
            if (style.panelStroke !== undefined) el.stroke = style.panelStroke
            if (style.panelStrokeWidth !== undefined) el.strokeWidth = style.panelStrokeWidth
            if (style.panelRadius !== undefined && !el.points) el.cornerRadius = style.panelRadius
          }
          if (el.type === 'bubble') {
            if (style.bubbleFont !== undefined) el.fontFamily = style.bubbleFont
            if (style.bubbleStroke !== undefined) el.stroke = style.bubbleStroke
          }
        }
      }
    })
  },

  renamePage: (id, name) => {
    const clean = name.trim().slice(0, 80)
    if (!clean) return
    get().mutate(
      (d) => {
        const pg = d.pages.find((p) => p.id === id)
        if (pg) pg.name = clean
      },
      { coalesce: `page-name:${id}` },
    )
  },

  copyPageContentTo: (srcId, destIds) => {
    const src = get().project?.pages.find((p) => p.id === srcId)
    const targets = destIds.filter((id) => id !== srcId)
    if (!src || !targets.length || !src.elements.length) return
    get().mutate((d) => {
      for (const id of targets) {
        const pg = d.pages.find((p) => p.id === id)
        if (pg) pg.elements.push(...(src.elements.map((e) => cloneElement(e, 0)) as Draft<ComicElement>[]))
      }
    }, { urgent: true })
    get().toast(targets.length === 1 ? 'Contenido copiado a 1 página' : `Contenido copiado a ${targets.length} páginas`, 'success')
  },

  goToPage: (index) => {
    const pages = get().project?.pages ?? []
    const pg = pages[Math.max(0, Math.min(pages.length - 1, Math.round(index)))]
    if (pg && pg.id !== get().pageId) get().setPage(pg.id)
  },

  duplicatePage: (id) => {
    const src = get().project?.pages.find((p) => p.id === id)
    if (!src) return
    const copy = clonePage(src)
    get().mutate((d) => {
      d.pages.splice(d.pages.findIndex((p) => p.id === id) + 1, 0, copy as Draft<Page>)
    }, { urgent: true })
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
    }, { urgent: true })
    if (pageId === id) get().setPage(get().project!.pages[Math.max(0, idx - 1)].id)
  },

  movePage: (from, to) =>
    get().mutate((d) => {
      if (from === to || to < 0 || to >= d.pages.length) return
      const [p] = d.pages.splice(from, 1)
      d.pages.splice(to, 0, p)
    }, { urgent: true }),

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
    }, { urgent: true })
    set({ selection: [] })
  },

  addPageFromTemplate: (templateId, margin, gutter) => {
    const { project, pageId } = get()
    const tpl = TEMPLATES.find((t) => t.id === templateId)
    if (!project || !tpl) return
    const page = createPage(nextPageName(project.pages), project.format)
    page.elements = buildTemplatePanels(tpl, project.format, margin, gutter)
    get().mutate((d) => {
      d.pages.splice(d.pages.findIndex((p) => p.id === pageId) + 1, 0, page as Draft<Page>)
    }, { urgent: true })
    get().setPage(page.id)
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
  const { project, saveStatus, revision, readOnly } = useEditor.getState()
  if (!project || readOnly) return
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

/** "Página N" con el primer número que no use otra página (los nombres no son ids, pero ayudan a ubicarse). */
export function nextPageName(pages: Pick<Page, 'name'>[]) {
  const used = new Set(pages.map((p) => p.name))
  let n = pages.length + 1
  while (used.has(`Página ${n}`)) n++
  return `Página ${n}`
}

const centerIn = (e: ComicElement, box: ComicElement) => {
  const cx = e.x + e.width / 2
  const cy = e.y + e.height / 2
  return cx >= box.x && cx <= box.x + box.width && cy >= box.y && cy <= box.y + box.height
}

function findBlock(script: Project['script'], pageId: string, blockId: string) {
  for (const row of script?.pages[pageId]?.panels ?? []) {
    const b = row.blocks.find((x) => x.id === blockId)
    if (b) return b
  }
  return undefined
}

export type ScriptStatus = 'pendiente' | 'colocado' | 'modificado'

/** Estado de un bloque: pendiente (no está en la página), colocado (igual) o modificado (los textos divergen). */
export function scriptStatus(page: Page | undefined, block: ScriptBlock): ScriptStatus {
  const el = block.placedElementId ? page?.elements.find((e) => e.id === block.placedElementId) : undefined
  if (!el || (el.type !== 'bubble' && el.type !== 'text')) return 'pendiente'
  return el.text === block.text ? 'colocado' : 'modificado'
}

let readOnlyToastAt = 0
function notifyReadOnly() {
  if (Date.now() - readOnlyToastAt < 3000) return
  readOnlyToastAt = Date.now()
  useEditor.getState().toast('Solo lectura: este proyecto se está editando en otra pestaña.', 'info')
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

/**
 * Dónde poner algo nuevo de w×h: en un lugar libre de la viñeta seleccionada o, si no hay, de la
 * parte visible de la página (para que aparezca a la vista y sin taparse con lo que ya está).
 */
export function placementFor(w: number, h: number): { x: number; y: number } {
  const s = useEditor.getState()
  const page = currentPage()
  if (!s.project || !page) return { x: 0, y: 0 }
  const { width: W, height: H } = s.project.format
  const pageRect = { x: 0, y: 0, width: W, height: H }
  const sel = s.selection.length === 1 ? page.elements.find((e) => e.id === s.selection[0] && e.type === 'panel') : undefined
  const visible = s.visibleRect ? intersect(s.visibleRect, pageRect) : pageRect
  const area = sel ? intersect({ x: sel.x, y: sel.y, width: sel.width, height: sel.height }, visible) : visible
  return findFreeSpot(Math.min(w, area.width), Math.min(h, area.height), page, area)
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
