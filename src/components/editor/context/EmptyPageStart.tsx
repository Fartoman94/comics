import { useState } from 'react'
import { PencilRuler } from 'lucide-react'
import { useCurrentPage, useEditor } from '../../../store/editor'
import { QUICK_LAYOUTS, TEMPLATES } from '../../../lib/templates'
import { TemplatePreview } from '../sidebar/LayoutsPanel'

/**
 * Estado vacío de una página: en vez de un lienzo en blanco, opciones visuales para empezar.
 * Aplicar una opción crea viñetas editables (no una imagen) y entra al historial como una acción.
 */
export function EmptyPageStart() {
  const page = useCurrentPage()
  const format = useEditor((s) => s.project?.format)
  const readOnly = useEditor((s) => s.readOnly)
  const tool = useEditor((s) => s.tool)
  // Páginas en las que la persona eligió "Página libre": no se vuelve a ofrecer en esta sesión.
  const [free, setFree] = useState<string[]>([])
  if (!page || !format || readOnly || page.elements.length > 0 || free.includes(page.id) || tool !== 'select') return null
  const ratio = format.width / format.height
  const choose = (id: string | null) => {
    const s = useEditor.getState()
    if (id === null) {
      setFree((f) => [...f, page.id])
      s.setTool('panel')
      s.toast('Página libre: arrastrá sobre el lienzo para dibujar viñetas, o agregá elementos.')
      return
    }
    s.applyTemplate(id, format.margin, Math.round(format.width * 0.018), 'replace')
  }
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4" data-testid="pagina-vacia">
      <section aria-labelledby="empeza-titulo" className="pointer-events-auto w-full max-w-xl rounded-2xl border border-ink-600 bg-ink-900/95 p-5 shadow-2xl backdrop-blur">
        <h2 id="empeza-titulo" className="text-base font-semibold text-white">
          Empezá tu primera página
        </h2>
        <p className="mt-1 text-xs text-ink-400">Elegí cómo repartir las viñetas. Después podés dividirlas, moverlas o cambiar la plantilla.</p>
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {QUICK_LAYOUTS.map((q) => {
            const tpl = q.id ? TEMPLATES.find((t) => t.id === q.id) : null
            return (
              <li key={q.label}>
                <button
                  onClick={() => choose(q.id)}
                  className="group flex w-full flex-col items-center gap-1.5 rounded-xl p-2 text-[11px] text-ink-200 ring-1 ring-ink-700 transition-colors hover:bg-ink-800 hover:text-white hover:ring-accent focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {tpl ? (
                    <TemplatePreview polys={tpl.polys} ratio={ratio} />
                  ) : (
                    <span className="flex items-center justify-center rounded-sm border border-dashed border-ink-500 text-ink-400 group-hover:border-accent group-hover:text-accent-bright" style={{ width: 60 * Math.min(1, ratio), height: Math.min(90, 60 / ratio) }}>
                      <PencilRuler size={18} />
                    </span>
                  )}
                  {q.label}
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
