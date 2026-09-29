import { useState } from 'react'
import { Files, Images, Layers, LayoutGrid, Shapes } from 'lucide-react'
import { cx } from '../../ui/controls'
import { MadeByMateLabs } from '../../ui/Brand'
import { PagesPanel } from './PagesPanel'
import { LayoutsPanel } from './LayoutsPanel'
import { AssetsPanel } from './AssetsPanel'
import { InsertPanel } from './InsertPanel'
import { LayersPanel } from './LayersPanel'

export type SidebarTab = 'pages' | 'layouts' | 'assets' | 'insert' | 'layers'

export const SIDEBAR_TABS: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
  { id: 'pages', label: 'Páginas', icon: <Files size={16} /> },
  { id: 'layouts', label: 'Viñetas', icon: <LayoutGrid size={16} /> },
  { id: 'assets', label: 'Imágenes', icon: <Images size={16} /> },
  { id: 'insert', label: 'Insertar', icon: <Shapes size={16} /> },
  { id: 'layers', label: 'Capas', icon: <Layers size={16} /> },
]

export function SidebarBody({ tab }: { tab: SidebarTab }) {
  return (
    <>
      {tab === 'pages' && <PagesPanel />}
      {tab === 'layouts' && <LayoutsPanel />}
      {tab === 'assets' && <AssetsPanel />}
      {tab === 'insert' && <InsertPanel />}
      {tab === 'layers' && <LayersPanel />}
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
          onClick={() => onChange(t.id)}
          className={cx('flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors', tab === t.id ? 'text-white shadow-[inset_0_-2px_0_var(--color-accent)]' : 'text-ink-400 hover:text-ink-100')}
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
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-ink-700 bg-ink-850 lg:flex">
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
