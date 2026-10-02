import { useCallback, useEffect, useRef, useState } from 'react'
import { notifyLocked, useEditor } from '../../store/editor'
import { renderPage } from '../../lib/render'
import { getThumb, setThumb, thumbIsFresh } from '../../lib/thumbs'
import { importFiles, placeAsset } from '../../lib/placement'
import type { Tool } from '../../types'
import { CanvasStage } from './CanvasStage'
import { TopBar } from './TopBar'
import { ToolRail } from './ToolRail'
import { Sidebar } from './sidebar/Sidebar'
import { Inspector } from './inspector/Inspector'
import { Reader } from './Reader'
import { Preview } from './Preview'
import { Overview } from './Overview'
import { PhoneFrameBar } from './PhoneFrameBar'
import { CropBar } from './CropBar'
import { ShortcutsDialog } from './ShortcutsDialog'
import { MobileBar } from './MobileBar'
import { Tour } from './Tour'
import { ExportDialog } from './ExportDialog'
import type { EditorNav } from './TopBar'
import { SimpleTopBar } from './mobile/SimpleTopBar'
import { SimpleBottomBar } from './mobile/SimpleBottomBar'
import { useUi } from '../../store/ui'
import { joinProject } from '../../lib/tabs'
import { loadProject, takeSnapshot } from '../../lib/storage'
import { HelpGuide } from '../help/HelpGuide'

const TOOL_KEYS: Record<string, Tool> = { v: 'select', h: 'hand', p: 'panel', g: 'bubble', t: 'text', b: 'brush', e: 'eraser' }

export function Editor() {
  // Vistas: edición (por defecto), lectura, previsualización y vista general.
  const [view, setView] = useState<'edit' | 'read' | 'preview' | 'overview'>('edit')
  const pageIndex = useEditor((s) => Math.max(0, s.project?.pages.findIndex((p) => p.id === s.pageId) ?? 0))
  const backToEdit = useCallback(() => setView('edit'), [])
  const [shortcuts, setShortcuts] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const openShortcuts = useCallback(() => setShortcuts(true), [])
  const simple = useUi((s) => s.mode === 'simple')
  // Mismas acciones para los dos layouts (estudio y simple).
  const nav: EditorNav = {
    read: () => setView('read'),
    preview: () => setView('preview'),
    overview: () => setView('overview'),
    exportOpen: () => setExportOpen(true),
    shortcuts: openShortcuts,
  }
  // Los avisos aparecen por encima de la barra inferior del celular.
  useEffect(() => {
    document.documentElement.style.setProperty('--toast-offset', simple ? '9.5rem' : '5rem')
    return () => void document.documentElement.style.removeProperty('--toast-offset')
  }, [simple])
  useAutosave()
  const tabs = useTabGuard()
  usePageThumbnails()
  useShortcuts(openShortcuts)
  useClipboardImages()

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-ink-950">
      {simple ? <SimpleTopBar nav={nav} /> : <TopBar nav={nav} />}
      {tabs.banner}
      <div className="flex min-h-0 flex-1">
        {!simple && <ToolRail />}
        {!simple && <Sidebar />}
        <div className="relative min-w-0 flex-1" data-ui-mode={simple ? 'simple' : 'studio'}>
          <CanvasStage />
          <CropBar />
          <PhoneFrameBar onPreview={() => setView('preview')} />
        </div>
        {!simple && <Inspector />}
      </div>
      {simple ? <SimpleBottomBar /> : <MobileBar />}
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
      {view === 'read' && <Reader onClose={backToEdit} startPage={pageIndex} />}
      {view === 'preview' && <Preview onClose={backToEdit} />}
      {view === 'overview' && <Overview onClose={backToEdit} />}
      <ShortcutsDialog open={shortcuts} onClose={() => setShortcuts(false)} />
      <HelpGuide canTour />
      {!simple && <Tour />}
    </div>
  )
}

/**
 * Guarda en IndexedDB 800 ms después del último cambio. Además guarda enseguida cuando la pestaña
 * se oculta o se cierra y cuando el editor se desmonta (Atrás, cambio de proyecto): nunca se pierde
 * el último cambio por el debounce.
 */
function useAutosave() {
  const project = useEditor((s) => s.project)
  const status = useEditor((s) => s.saveStatus)
  const timer = useRef<number>(0)
  useEffect(() => {
    if (!project || status !== 'dirty') return
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void useEditor.getState().saveNow(), 800)
    return () => clearTimeout(timer.current)
  }, [project, status])

  useEffect(() => {
    const flush = () => void useEditor.getState().saveNow()
    const onHidden = () => document.visibilityState === 'hidden' && flush()
    const onUnload = (e: BeforeUnloadEvent) => {
      const s = useEditor.getState()
      if (s.saveStatus === 'dirty' || s.saveStatus === 'saving' || s.saveStatus === 'error') {
        flush()
        e.preventDefault()
      }
    }
    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', onUnload)
    return () => {
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', onUnload)
      // El editor se va (Atrás, otro proyecto): lo pendiente se guarda ya.
      flush()
    }
  }, [])
}

/**
 * Una pestaña por proyecto: si ya está abierto en otra, se elige entre solo lectura o editar acá
 * (la otra pasa a solo lectura). Nunca gana en silencio el último guardado.
 */
function useTabGuard() {
  const projectId = useEditor((s) => s.project!.id)
  const readOnly = useEditor((s) => s.readOnly)
  const [ask, setAsk] = useState(false)
  const [taken, setTaken] = useState(false)
  const handle = useRef<ReturnType<typeof joinProject> | null>(null)
  useEffect(() => {
    const h = joinProject(
      projectId,
      () => !useEditor.getState().readOnly,
      () => {
        // Otra pestaña tomó el control: lo pendiente se guarda y esta queda en solo lectura.
        void useEditor.getState().saveNow().then(() => useEditor.getState().setReadOnly(true))
        setTaken(true)
      },
    )
    handle.current = h
    void h.check().then((busy) => {
      if (busy) {
        useEditor.getState().setReadOnly(true)
        setAsk(true)
      }
    })
    // Instantánea al abrir (si la última tiene más de 5 minutos).
    const p = useEditor.getState().project
    if (p) void takeSnapshot(p).catch(() => undefined)
    return () => h.leave()
  }, [projectId])
  const editHere = () => {
    handle.current?.takeOver()
    setAsk(false)
    setTaken(false)
    // Se recarga lo último que guardó la otra pestaña antes de editar.
    void loadProject(projectId).then((p) => {
      if (p) useEditor.getState().openProject(p)
      useEditor.getState().setReadOnly(false)
    })
  }
  const banner = readOnly ? (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-amber-500/40 bg-amber-950/60 px-3 py-2 text-xs text-amber-100" role="status" data-testid="solo-lectura">
      <span className="flex-1">{taken ? 'Seguiste editando este proyecto en otra pestaña: esta quedó en solo lectura.' : ask ? 'Este proyecto ya está abierto en otra pestaña. Para no pisar cambios, se abrió en solo lectura.' : 'Solo lectura.'}</span>
      <button onClick={editHere} className="rounded-md bg-amber-500/90 px-3 py-1.5 font-medium text-black hover:bg-amber-400">
        Editar en esta pestaña
      </button>
    </div>
  ) : null
  return { banner }
}

function usePageThumbnails() {
  const project = useEditor((s) => s.project)
  useEffect(() => {
    if (!project) return
    const t = window.setTimeout(async () => {
      const ratio = Math.min(0.25, 220 / project.format.width)
      for (const page of project.pages) {
        if (thumbIsFresh(page.id, page)) continue
        const src = await renderPage(project, page, { pixelRatio: ratio, mime: 'image/jpeg', quality: 0.8 })
        setThumb(page.id, src, page)
      }
      // Portada del proyecto para la pantalla de inicio.
      const first = project.pages[0]
      const cover = getThumb(first.id)
      const current = useEditor.getState().project
      if (cover && current && current.thumbnail !== cover && current.pages[0] === first) {
        useEditor.getState().mutate((d) => void (d.thumbnail = cover), { history: false })
      }
    }, 1200)
    return () => clearTimeout(t)
  }, [project])
}

function isTyping(e: Event) {
  const t = e.target as HTMLElement | null
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
}

function useShortcuts(openHelp: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e)) return
      const s = useEditor.getState()
      // Con el lector abierto las teclas son del lector: el documento no se toca.
      if (s.readerOpen) return
      const mod = e.metaKey || e.ctrlKey
      const k = e.key.toLowerCase()
      if (mod && k === 'z') {
        e.preventDefault()
        if (e.shiftKey) s.redo()
        else s.undo()
      } else if (mod && k === 'y') {
        e.preventDefault()
        s.redo()
      } else if (mod && k === 'd') {
        e.preventDefault()
        s.duplicateSelection()
      } else if (mod && k === 'c') {
        s.copySelection()
      } else if (mod && k === 'x') {
        s.copySelection()
        s.deleteSelection()
      } else if (mod && k === 'a') {
        e.preventDefault()
        const page = s.project?.pages.find((p) => p.id === s.pageId)
        if (page) s.select(page.elements.filter((el) => !el.locked && !el.hidden).map((el) => el.id))
      } else if (mod && (k === '=' || k === '+')) {
        e.preventDefault()
        s.setZoom(Math.min(8, s.zoom * 1.25))
      } else if (mod && k === '-') {
        e.preventDefault()
        s.setZoom(Math.max(0.05, s.zoom / 1.25))
      } else if (mod && k === '0') {
        e.preventDefault()
        s.requestFit()
      } else if (mod && k === ']') {
        e.preventDefault()
        s.arrange(e.shiftKey ? 'front' : 'forward')
      } else if (mod && k === '[') {
        e.preventDefault()
        s.arrange(e.shiftKey ? 'back' : 'backward')
      } else if (k === 'delete' || k === 'backspace') {
        if (s.selection.length) {
          e.preventDefault()
          s.deleteSelection()
        }
      } else if (k === 'escape') {
        if (s.croppingPanelId) s.setCropping(null)
        else if (s.tool !== 'select') s.setTool('select')
        else s.select([])
      } else if (k.startsWith('arrow') && s.selection.length) {
        e.preventDefault()
        const locked = s.project?.pages.find((p) => p.id === s.pageId)?.elements.filter((el) => s.selection.includes(el.id) && el.locked).length ?? 0
        if (locked && !e.repeat) notifyLocked(locked)
        const d = e.shiftKey ? 10 : 1
        const dx = k === 'arrowleft' ? -d : k === 'arrowright' ? d : 0
        const dy = k === 'arrowup' ? -d : k === 'arrowdown' ? d : 0
        s.mutate(
          (draft) => {
            const page = draft.pages.find((p) => p.id === s.pageId)
            page?.elements.forEach((el) => {
              if (s.selection.includes(el.id) && !el.locked) {
                el.x += dx
                el.y += dy
              }
            })
          },
          { coalesce: 'nudge' },
        )
      } else if (k === 'pageup' || k === 'pagedown') {
        const pages = s.project?.pages ?? []
        const i = pages.findIndex((p) => p.id === s.pageId)
        const next = pages[i + (k === 'pagedown' ? 1 : -1)]
        if (next) s.setPage(next.id)
      } else if (k === '?') {
        openHelp()
      } else if (k === '[' || k === ']') {
        const key = s.tool === 'eraser' ? 'eraserSize' : 'size'
        const cur = s.brush[key]
        s.setBrush({ [key]: Math.max(1, Math.min(200, Math.round(k === ']' ? cur * 1.2 + 1 : cur / 1.2))) })
      } else if (!mod && !e.altKey && TOOL_KEYS[k]) {
        s.setTool(TOOL_KEYS[k])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openHelp])
}

/** Ctrl+V con una imagen en el portapapeles la agrega al proyecto. */
function useClipboardImages() {
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      if (isTyping(e) || useEditor.getState().readerOpen) return
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'))
      if (files.length) {
        e.preventDefault()
        const assets = await importFiles(files)
        assets.forEach((a) => placeAsset(a))
      } else {
        useEditor.getState().paste()
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])
}
