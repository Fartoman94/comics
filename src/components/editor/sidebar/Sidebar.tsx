import { useState } from 'react'
import { FileText, Files, Images, Layers, LayoutGrid, Shapes } from 'lucide-react'
import { cx } from '../../ui/controls'
import { MadeByMateLabs } from '../../ui/Brand'
import { useUi } from '../../../store/ui'
import { PagesPanel } from './PagesPanel'
import { LayoutsPanel } from './LayoutsPanel'
import { AssetsPanel } from './AssetsPanel'
import { InsertPanel } from './InsertPanel'
import { LayersPanel } from './LayersPanel'
import { ScriptPanel } from './ScriptPanel'

export type SidebarTab = 'pages' | 'layouts' | 'assets' | 'insert' | 'layers' | 'script'

export const SIDEBAR_TABS: { id: SidebarTab; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: 'pages', label: 'Páginas', icon: <Files size={16} />, hint: 'Páginas del proyecto: agregar, ordenar, duplicar' },
  { id: 'layouts', label: 'Plantillas', icon: <LayoutGrid size={16} />, hint: 'Plantillas de viñetas para la página' },
  { id: 'insert', label: 'Elementos', icon: <Shapes size={16} />, hint: 'Globos, textos, onomatopeyas y efectos' },
  { id: 'assets', label: 'Biblioteca', icon: <Images size={16} />, hint: 'Imágenes del proyecto y elementos guardados' },
  { id: 'layers', label: 'Capas', icon: <Layers size={16} />, hint: 'Orden, visibilidad y bloqueo de los elementos' },
  { id: 'script', label: 'Guion', icon: <FileText size={16} />, hint: 'Guion por página y viñeta' },
]

export function SidebarBody({ tab }: { tab: SidebarTab }) {
  return (
    <>
      {tab === 'pages' && <PagesPanel />}
      {tab === 'layouts' && <LayoutsPanel />}
      {tab === 'assets' && <AssetsPanel />}
      {tab === 'insert' && <InsertPanel />}
      {tab === 'layers' && <LayersPanel />}
      {tab === 'script' && <ScriptPanel />}
    </>
  )
}

export function SidebarTabs({ tab, onChange }: { tab: SidebarTab; onChange: (t: SidebarTab) => void }) {
  return (
    <div className="flex shrink-0 border-b border-ink-700" role="tablist">
      {SIDEBAR_TABS.map((t) => (
        <button
          key={t.id}
          data-tour={`tab-${t.id}`}
          role="tab"
          aria-selected={tab === t.id}
          title={t.hint}
          onClick={() => onChange(t.id)}
          className={cx('flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium tracking-tight transition-colors', tab === t.id ? 'text-white shadow-[inset_0_-2px_0_var(--color-accent)]' : 'text-ink-400 hover:text-ink-100')}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Sidebar() {
  const [tab, setTab] = useState<SidebarTab>('pages')
  const open = useUi((s) => s.sidebar)
  if (!open) return null
  return (
    // Desde tablet (768 px): plegable desde la barra de herramientas; en escritorio arranca abierta.
    <aside aria-label="Paneles del proyecto" className="hidden w-72 shrink-0 flex-col border-r border-ink-700 bg-ink-850 md:flex xl:w-80">
      <SidebarTabs tab={tab} onChange={setTab} />
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <SidebarBody tab={tab} />
      </div>
      <div className="flex justify-center border-t border-ink-700 py-2">
        <MadeByMateLabs size="sm" />
      </div>
    </aside>
  )
}
