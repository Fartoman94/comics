import { Brush, Eraser, Hand, MessageCircle, MousePointer2, PanelLeftClose, PanelLeftOpen, SquareDashed, Type } from 'lucide-react'
import { useUi } from '../../store/ui'
import type { Tool } from '../../types'
import { useEditor } from '../../store/editor'
import { cx } from '../ui/controls'
import { MATELABS_URL } from '../ui/Brand'

const TOOLS: { id: Tool; icon: React.ReactNode; label: string; key: string }[] = [
  { id: 'select', icon: <MousePointer2 size={18} />, label: 'Seleccionar', key: 'V' },
  { id: 'hand', icon: <Hand size={18} />, label: 'Mano (o mantené Espacio)', key: 'H' },
  { id: 'panel', icon: <SquareDashed size={18} />, label: 'Dibujar viñeta', key: 'P' },
  { id: 'bubble', icon: <MessageCircle size={18} />, label: 'Globo de diálogo', key: 'G' },
  { id: 'text', icon: <Type size={18} />, label: 'Texto', key: 'T' },
  { id: 'brush', icon: <Brush size={18} />, label: 'Pincel', key: 'B' },
  { id: 'eraser', icon: <Eraser size={18} />, label: 'Borrador', key: 'E' },
]

function SidebarToggle() {
  const open = useUi((s) => s.sidebar)
  return (
    <button
      onClick={() => useUi.getState().setSidebar(!open)}
      title={open ? 'Ocultar paneles (más lugar para el lienzo)' : 'Mostrar paneles'}
      aria-label={open ? 'Ocultar paneles' : 'Mostrar paneles'}
      aria-pressed={open}
      className="mb-1 hidden size-9 items-center justify-center rounded-lg text-ink-300 hover:bg-ink-700 hover:text-white md:flex"
    >
      {open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
    </button>
  )
}

export function ToolRail() {
  const tool = useEditor((s) => s.tool)
  const setTool = useEditor((s) => s.setTool)
  return (
    <nav data-tour="tools" className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-ink-700 bg-ink-900 py-2" aria-label="Herramientas">
      {TOOLS.map((t, i) => (
        <div key={t.id} className="contents">
          {(i === 2 || i === 5) && <div className="my-1 h-px w-6 bg-ink-700" />}
          <button
            onClick={() => setTool(t.id)}
            title={`${t.label} (${t.key})`}
            aria-label={t.label}
            aria-pressed={tool === t.id}
            className={cx('group relative flex size-9 items-center justify-center rounded-lg transition-colors', tool === t.id ? 'bg-accent text-white' : 'text-ink-300 hover:bg-ink-700 hover:text-white')}
          >
            {t.icon}
            <span className="absolute right-0.5 bottom-0 text-[8px] font-semibold opacity-50">{t.key}</span>
          </button>
        </div>
      ))}
      <div className="flex-1" />
      <SidebarToggle />
      <a href={MATELABS_URL} target="_blank" rel="noopener noreferrer" title="Creado por MateLabs" className="rounded-lg p-1.5 opacity-70 transition-opacity hover:bg-ink-700 hover:opacity-100">
        <img src="/brand/matelabs-logo.png" alt="MateLabs" className="size-6 object-contain" />
      </a>
    </nav>
  )
}
