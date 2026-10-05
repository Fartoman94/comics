import type { PanelElement } from '../../types'
import { useEditor } from '../../store/editor'
import { childrenOf } from '../../lib/hierarchy'
import { confirmDialog } from '../ui/Confirm'

/**
 * Elimina la selección; si incluye viñetas con contenido encima (globos, textos, imágenes) o con
 * imagen propia, pregunta antes. El contenido de encima no se borra: queda en la página.
 */
export async function deleteWithConfirm() {
  const s = useEditor.getState()
  const page = s.project?.pages.find((p) => p.id === s.pageId)
  if (!page) return
  const panels = page.elements.filter((e): e is PanelElement => s.selection.includes(e.id) && e.type === 'panel' && !e.locked)
  const filled = panels.filter((p) => p.image || childrenOf(page, p).length > 0)
  if (filled.length) {
    const n = filled.reduce((acc, p) => acc + childrenOf(page, p).length, 0)
    const what = [filled.some((p) => p.image) && 'su imagen', n > 0 && `${n} elemento(s) encima (quedan en la página)`].filter(Boolean).join(' y ')
    const ok = await confirmDialog(filled.length === 1 ? 'Eliminar viñeta' : `Eliminar ${filled.length} viñetas`, `La viñeta tiene ${what}. Podés deshacerlo con Ctrl+Z.`, { confirmLabel: 'Eliminar', danger: true })
    if (!ok) return
  }
  useEditor.getState().deleteSelection()
}
