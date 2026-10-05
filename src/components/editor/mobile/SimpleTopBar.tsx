import { useState } from 'react'
import { BookOpenText, Check, FileText, CircleAlert, CircleHelp, Cloud, Download, Eye, Grid2x2, Home, Loader2, MonitorCog, MoreVertical, Redo2, SunMoon, Undo2 } from 'lucide-react'
import { useEditor } from '../../../store/editor'
import { useUi } from '../../../store/ui'
import { navigateToProject } from '../../../lib/nav'
import { Menu, MenuItem } from '../../ui/controls'
import { useHelp } from '../../help/HelpGuide'
import type { EditorNav } from '../TopBar'

const STATUS = {
  saved: { icon: <Check size={15} />, text: 'Guardado', cls: 'text-ink-400' },
  dirty: { icon: <Cloud size={15} />, text: 'Cambios sin guardar', cls: 'text-ink-400' },
  saving: { icon: <Loader2 size={15} className="animate-spin" />, text: 'Guardando…', cls: 'text-ink-300' },
  error: { icon: <CircleAlert size={15} />, text: 'Error al guardar', cls: 'text-red-400' },
} as const

/** Barra superior del modo simple: volver, título legible, guardado, deshacer/rehacer y menú. */
export function SimpleTopBar({ nav }: { nav: EditorNav }) {
  const title = useEditor((s) => s.project!.title)
  const status = useEditor((s) => s.saveStatus)
  const canUndo = useEditor((s) => s.past.length > 0)
  const canRedo = useEditor((s) => s.future.length > 0)
  const [editing, setEditing] = useState(false)
  const s = useEditor.getState()
  const st = STATUS[status]
  const goHome = async () => {
    if (await useEditor.getState().saveNow()) navigateToProject(null)
  }
  const btn = 'flex size-11 shrink-0 items-center justify-center rounded-lg text-ink-100 hover:bg-ink-700 disabled:opacity-35'
  return (
    <header className="flex min-h-14 shrink-0 items-center gap-1 border-b border-ink-700 bg-ink-900 px-1 pt-[env(safe-area-inset-top)]">
      <button onClick={() => void goHome()} className={btn} aria-label="Volver a mis proyectos" title="Volver a mis proyectos">
        <Home size={19} />
      </button>
      <div className="min-w-0 flex-1 px-1">
        {editing ? (
          <input
            autoFocus
            defaultValue={title}
            aria-label="Título del proyecto"
            className="h-10 w-full rounded-md border border-accent bg-ink-950 px-2 text-sm text-fg outline-none"
            onBlur={(e) => {
              setEditing(false)
              const v = e.currentTarget.value.trim()
              if (v) s.mutate((d) => void (d.title = v))
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') setEditing(false)
            }}
          />
        ) : (
          // Título completo en hasta dos líneas; tocarlo permite cambiarlo.
          <button onClick={() => setEditing(true)} className="flex min-h-11 w-full items-center rounded-md px-1 py-0.5 text-left hover:bg-ink-800" aria-label={`Título: ${title}. Tocá para cambiarlo`}>
            <h1 className="line-clamp-2 text-[13px] leading-tight font-semibold break-words text-fg">{title}</h1>
          </button>
        )}
      </div>
      <span className={`flex size-8 shrink-0 items-center justify-center ${st.cls}`} title={st.text} role="status" aria-label={st.text}>
        {st.icon}
      </span>
      <button className={btn} onClick={s.undo} disabled={!canUndo} aria-label="Deshacer" title="Deshacer">
        <Undo2 size={19} />
      </button>
      <button className={btn} onClick={s.redo} disabled={!canRedo} aria-label="Rehacer" title="Rehacer">
        <Redo2 size={19} />
      </button>
      <Menu
        align="right"
        trigger={(_, toggle) => (
          <button className={btn} onClick={toggle} aria-label="Más opciones del proyecto" title="Más opciones">
            <MoreVertical size={19} />
          </button>
        )}
      >
        {(close) => (
          <>
            <MenuItem label="Leer" onClick={() => (close(), nav.read())} icon={<BookOpenText size={15} />} />
            <MenuItem label="Previsualizar" onClick={() => (close(), nav.preview())} icon={<Eye size={15} />} />
            <MenuItem label="Vista general" onClick={() => (close(), nav.overview())} icon={<Grid2x2 size={15} />} />
            <MenuItem label="Guion" hint="Diálogos por viñeta" onClick={() => (close(), useUi.getState().requestSheet('script'))} icon={<FileText size={15} />} />
            <MenuItem label="Exportar…" hint="PDF, PNG, ZIP, libro web" onClick={() => (close(), nav.exportOpen())} icon={<Download size={15} />} />
            <MenuItem label="Ayuda" onClick={() => (close(), useHelp.getState().openGuide())} icon={<CircleHelp size={15} />} />
            <MenuItem label={useUi.getState().theme === 'light' ? 'Modo noche' : 'Modo día'} hint="Se recuerda en este navegador" onClick={() => (close(), useUi.getState().setTheme(useUi.getState().theme === 'light' ? 'dark' : 'light'))} icon={<SunMoon size={15} />} />
            <MenuItem label="Modo estudio" hint="Todas las herramientas a la vista" onClick={() => (close(), useUi.getState().setMode('studio'))} icon={<MonitorCog size={15} />} />
          </>
        )}
      </Menu>
    </header>
  )
}
