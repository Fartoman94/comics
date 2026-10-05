import { BookOpenText, Check, CircleHelp, ChevronDown, CircleAlert, Cloud, Download, Eye, Grid2x2, Grid3x3, Keyboard, LayoutDashboard, Loader2, Magnet, Minus, Plus, Redo2, Ruler, Smartphone, SunMoon, Undo2 } from 'lucide-react'
import { useEditor } from '../../store/editor'
import { navigateToProject } from '../../lib/nav'
import { Button, IconButton, Menu, MenuItem } from '../ui/controls'
import { AppLogo } from '../ui/Brand'
import { useUi } from '../../store/ui'
import { useHelp } from '../help/HelpGuide'
import { HistoryMenu } from './HistoryMenu'
import { ZoomMenu } from './ZoomMenu'
import { ThemeToggle } from '../ui/ThemeToggle'

export interface EditorNav {
  read(): void
  preview(): void
  overview(): void
  exportOpen(): void
  shortcuts(): void
}

export function TopBar({ nav }: { nav: EditorNav }) {
  const { read: onRead, preview: onPreview, overview: onOverview, shortcuts: onShortcuts } = nav
  const title = useEditor((s) => s.project!.title)
  const status = useEditor((s) => s.saveStatus)
  const canUndo = useEditor((s) => s.past.length > 0)
  const canRedo = useEditor((s) => s.future.length > 0)
  const zoom = useEditor((s) => s.zoom)
  const view = useEditor((s) => s.view)
  const s = useEditor.getState()

  const goHome = async () => {
    // Si no se pudo guardar se queda en el editor: el aviso ofrece "Reintentar".
    if (await useEditor.getState().saveNow()) navigateToProject(null)
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-ink-700 bg-ink-900 px-2">
      <button onClick={() => void goHome()} className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-ink-700" title="Volver a mis proyectos">
        <AppLogo className="size-7" />
        <LayoutDashboard size={14} className="hidden text-ink-400 sm:block" />
      </button>
      <div className="h-5 w-px bg-ink-700" />
      <input
        value={title}
        onChange={(e) => s.mutate((d) => void (d.title = e.target.value), { coalesce: 'title' })}
        className="h-8 w-24 min-w-0 truncate rounded-md border border-transparent bg-transparent px-2 text-sm font-medium text-fg outline-none hover:border-ink-600 focus:border-accent sm:w-56"
        aria-label="Título del proyecto"
      />
      <SaveBadge status={status} />

      <div className="flex items-center sm:ml-2">
        <IconButton label="Deshacer (Ctrl+Z)" disabled={!canUndo} onClick={s.undo}>
          <Undo2 size={16} />
        </IconButton>
        <IconButton label="Rehacer (Ctrl+Shift+Z)" disabled={!canRedo} onClick={s.redo}>
          <Redo2 size={16} />
        </IconButton>
        <div className="max-sm:hidden">
          <HistoryMenu />
        </div>
      </div>

      <div className="flex-1" />

      <div className="hidden items-center rounded-lg bg-ink-800 ring-1 ring-ink-700 md:flex">
        <IconButton label="Alejar (Ctrl -)" onClick={() => s.setZoom(Math.max(0.05, zoom / 1.25))}>
          <Minus size={14} />
        </IconButton>
        <ZoomMenu />
        <IconButton label="Acercar (Ctrl +)" onClick={() => s.setZoom(Math.min(8, zoom * 1.25))}>
          <Plus size={14} />
        </IconButton>
      </div>

      <div className="hidden items-center lg:flex">
        <IconButton label="Guías de margen y sangrado" active={view.guides} onClick={() => s.setView({ guides: !view.guides })}>
          <Ruler size={16} />
        </IconButton>
        <IconButton label="Cuadrícula" active={view.grid} onClick={() => s.setView({ grid: !view.grid })}>
          <Grid3x3 size={16} />
        </IconButton>
        <IconButton label="Imanes (Alt al arrastrar para desactivar)" active={view.snap} onClick={() => s.setView({ snap: !view.snap })}>
          <Magnet size={16} />
        </IconButton>
        <ThemeToggle />
        <IconButton label="Atajos de teclado (?)" onClick={onShortcuts}>
          <Keyboard size={16} />
        </IconButton>
      </div>

      <Button variant="ghost" size="sm" onClick={() => useHelp.getState().openGuide()} data-tour="help" title="Guía de uso" aria-label="Ayuda" className="max-sm:hidden">
        <CircleHelp size={15} /> <span className="hidden xl:inline">Ayuda</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={onOverview} title="Vista general de páginas" aria-label="Vista general" className="max-md:hidden">
        <Grid2x2 size={15} /> <span className="hidden xl:inline">Vista general</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={onPreview} title="Previsualizar sin guías ni selección" aria-label="Previsualizar" className="max-sm:hidden">
        <Eye size={15} /> <span className="hidden xl:inline">Previsualizar</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={onRead} data-tour="read" title="Leer como libro" aria-label="Leer" className="max-sm:hidden">
        <BookOpenText size={15} /> <span className="hidden lg:inline">Leer</span>
      </Button>
      <Menu
        align="right"
        trigger={(_, toggle) => (
          <Button variant="primary" size="sm" onClick={toggle} data-tour="export" aria-label="Exportar" className="shrink-0">
            <Download size={15} /> <span className="hidden sm:inline">Exportar</span> <ChevronDown size={13} />
          </Button>
        )}
      >
        {(close) => (
          <>
            <MenuItem label="Exportar…" hint="PDF, PNG, ZIP" onClick={() => (close(), nav.exportOpen())} icon={<Download size={14} />} />
            <MenuItem label="Ver lectura" onClick={() => (close(), onRead())} icon={<BookOpenText size={14} />} />
            <MenuItem label="Previsualizar" onClick={() => (close(), onPreview())} icon={<Eye size={14} />} />
            <MenuItem label="Vista general" onClick={() => (close(), onOverview())} icon={<Grid2x2 size={14} />} />
            <MenuItem label="Ayuda" hint="Guía de uso" onClick={() => (close(), useHelp.getState().openGuide())} icon={<CircleHelp size={14} />} className="sm:hidden" />
            <MenuItem label={useUi.getState().theme === 'light' ? 'Modo noche' : 'Modo día'} hint="Se recuerda en este navegador" onClick={() => (close(), useUi.getState().setTheme(useUi.getState().theme === 'light' ? 'dark' : 'light'))} icon={<SunMoon size={14} />} className="lg:hidden" />
            <MenuItem label="Modo simple" hint="Menos botones, lienzo más grande" onClick={() => (close(), useUi.getState().setMode('simple'))} icon={<Smartphone size={14} />} />
          </>
        )}
      </Menu>
    </header>
  )
}

function SaveBadge({ status }: { status: string }) {
  const map = {
    saved: { icon: <Check size={13} />, text: 'Guardado', cls: 'text-ink-400' },
    dirty: { icon: <Cloud size={13} />, text: 'Cambios sin guardar', cls: 'text-ink-400' },
    saving: { icon: <Loader2 size={13} className="animate-spin" />, text: 'Guardando…', cls: 'text-ink-300' },
    error: { icon: <CircleAlert size={13} />, text: 'Error al guardar', cls: 'text-red-400' },
  } as const
  const m = map[status as keyof typeof map]
  return (
    <span role="status" aria-live="polite" title={m.text} data-testid="estado-guardado" className={`hidden items-center gap-1 text-[11px] sm:flex ${m.cls}`}>
      {m.icon}
      <span className="max-lg:sr-only">{m.text}</span>
    </span>
  )
}
