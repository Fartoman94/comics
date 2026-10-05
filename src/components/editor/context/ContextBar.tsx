import { ChevronRight } from 'lucide-react'
import { useCurrentPage, useEditor } from '../../../store/editor'
import { parentPanelOf, panelNumber, TYPE_LABEL } from '../../../lib/hierarchy'
import type { ComicElement, Tool } from '../../../types'

const TOOL_HINT: Partial<Record<Tool, string>> = {
  hand: 'Mano: arrastrá para mover el lienzo · Esc para volver',
  panel: 'Viñeta: arrastrá sobre la página para dibujarla · Esc para volver',
  bubble: 'Globo: hacé clic donde va el globo · Esc para volver',
  text: 'Texto: hacé clic donde va el texto · Esc para volver',
  brush: 'Pincel: dibujá sobre la página · [ y ] cambian el tamaño',
  eraser: 'Borrador: pasá sobre los trazos para borrarlos',
}

function hintFor(el: ComicElement): string {
  if (el.locked) return 'Bloqueado: desbloquealo para moverlo'
  switch (el.type) {
    case 'panel':
      return el.image ? 'Doble clic para encuadrar la imagen' : 'Soltá una imagen adentro o hacé doble clic para subirla'
    case 'image':
      return 'Doble clic para recortar'
    case 'bubble':
      return 'Doble clic para escribir · arrastrá el punto naranja para mover la cola'
    case 'text':
      return 'Doble clic para escribir'
    case 'drawing':
      return 'Elegí el pincel para seguir dibujando en esta capa'
    default:
      return 'Arrastrá para mover · las esquinas cambian el tamaño'
  }
}

/** Ubicación de la edición (Página › Viñeta › Elemento) y qué se puede hacer ahora. */
export function ContextBar() {
  const page = useCurrentPage()
  const pageIndex = useEditor((s) => s.project?.pages.findIndex((p) => p.id === s.pageId) ?? -1)
  const selection = useEditor((s) => s.selection)
  const tool = useEditor((s) => s.tool)
  const cropping = useEditor((s) => s.croppingPanelId)
  const editing = useEditor((s) => s.editingTextId)
  if (!page || cropping) return null
  const s = useEditor.getState()
  const selected = page.elements.filter((e) => selection.includes(e.id))
  const one = selected.length === 1 ? selected[0] : undefined
  const parent = one ? parentPanelOf(page, one) : undefined
  const hint = TOOL_HINT[tool] ?? (editing ? 'Escribiendo: Ctrl+Enter o clic afuera para terminar' : one ? hintFor(one) : selected.length > 1 ? `${selected.length} elementos: arrastrá para moverlos juntos` : 'Hacé clic en un elemento para editarlo')
  const crumb = 'max-w-40 truncate rounded px-1.5 py-0.5 hover:bg-ink-700 hover:text-white'
  return (
    <div className="pointer-events-none absolute top-3 left-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2" data-testid="contexto-edicion">
      <nav aria-label="Ubicación de la edición" className="pointer-events-auto flex items-center gap-0.5 rounded-lg border border-ink-700 bg-ink-900/90 px-1.5 py-1 text-[11px] text-ink-300 shadow-lg backdrop-blur">
        <button className={crumb} onClick={() => s.select([])} title="Ver propiedades de la página">
          Página {pageIndex + 1}
        </button>
        {parent && one && (
          <>
            <ChevronRight size={12} className="shrink-0 text-ink-500" aria-hidden />
            <button className={crumb} onClick={() => s.select([parent.id])} title="Seleccionar la viñeta">
              Viñeta {panelNumber(page, parent)}
            </button>
          </>
        )}
        {one && (
          <>
            <ChevronRight size={12} className="shrink-0 text-ink-500" aria-hidden />
            <span className="max-w-48 truncate px-1.5 py-0.5 font-medium text-white" aria-current="location">
              {one.type === 'panel' ? `Viñeta ${panelNumber(page, one)}` : TYPE_LABEL[one.type]}
              {one.type !== 'panel' && one.name !== TYPE_LABEL[one.type] && <span className="font-normal text-ink-400"> · {one.name}</span>}
            </span>
          </>
        )}
        {selected.length > 1 && (
          <>
            <ChevronRight size={12} className="shrink-0 text-ink-500" aria-hidden />
            <span className="px-1.5 py-0.5 font-medium text-white">{selected.length} elementos</span>
          </>
        )}
      </nav>
      <p className="truncate rounded-md bg-ink-950/70 px-2 py-1 text-[11px] text-ink-400 max-md:hidden" aria-live="polite">
        {hint}
      </p>
    </div>
  )
}
