import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEditor } from '../../../store/editor'
import { useUi } from '../../../store/ui'

/** Celular: página actual con anterior/siguiente; tocar el número abre la hoja de Páginas. */
export function PageSwitcher() {
  const total = useEditor((s) => s.project?.pages.length ?? 0)
  const index = useEditor((s) => s.project?.pages.findIndex((p) => p.id === s.pageId) ?? 0)
  const editing = useEditor((s) => !!s.editingTextId || !!s.croppingPanelId)
  if (editing || total === 0) return null
  const s = useEditor.getState()
  const btn = 'flex size-10 items-center justify-center rounded-full text-ink-100 active:bg-ink-600 disabled:opacity-30'
  return (
    <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center" data-testid="selector-pagina">
      <div className="pointer-events-auto flex items-center rounded-full border border-ink-600 bg-ink-900/90 shadow-lg backdrop-blur">
        <button className={btn} aria-label="Anterior" title="Página anterior" disabled={index <= 0} onClick={() => s.goToPage(index - 1)}>
          <ChevronLeft size={18} />
        </button>
        <button className="min-h-10 px-2 text-xs font-medium text-white tabular-nums" aria-label={`Páginas: ${index + 1} de ${total}. Tocá para verlas todas`} onClick={() => useUi.getState().requestSheet('pages')}>
          Pág. {index + 1} / {total}
        </button>
        <button className={btn} aria-label="Siguiente" title="Página siguiente" disabled={index >= total - 1} onClick={() => s.goToPage(index + 1)}>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
