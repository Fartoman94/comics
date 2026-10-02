import type { Asset, ComicElement } from '../types'
import { currentPage, placementFor, useEditor } from '../store/editor'
import { cloneElement } from './factories'
import { referencedAssetIds } from './projectSchema'
import { placeAsset } from './placement'
import { saveComposition, updateLibraryItem, type LibraryItem } from './storage'

/** Lleva al proyecto los recursos que faltan (mismo blob, por referencia: nada se copia ni se pierde). */
function ensureAssets(assets: Asset[]) {
  const s = useEditor.getState()
  const have = new Set(s.project?.assets.map((a) => a.id))
  const missing = assets.filter((a) => !have.has(a.id))
  if (missing.length) s.mutate((d) => void d.assets.push(...missing), { history: false })
}

/** Inserta un ítem de la biblioteca en la página actual (con un toque, un clic o al soltarlo). */
export function insertLibraryItem(item: LibraryItem, at?: { x: number; y: number }) {
  const s = useEditor.getState()
  if (!s.project) return
  void updateLibraryItem(item.id, { lastUsedAt: Date.now() })
  if (item.type === 'image') {
    ensureAssets([item.asset])
    placeAsset(item.asset, at)
    return
  }
  ensureAssets(item.assets)
  // Copia independiente: ids nuevos, misma composición relativa.
  const origin = at ? { x: at.x - item.width / 2, y: at.y - item.height / 2 } : placementFor(item.width, item.height)
  const copies = item.elements.map((e) => {
    const c = cloneElement(e, 0)
    c.x += origin.x
    c.y += origin.y
    return c
  })
  s.addElements(copies)
}

/** Guarda lo seleccionado como "elemento reutilizable" en la biblioteca. */
export async function saveSelectionToLibrary(name: string) {
  const s = useEditor.getState()
  const page = currentPage()
  if (!s.project || !page || !s.selection.length) return null
  const elements: ComicElement[] = page.elements.filter((e) => s.selection.includes(e.id))
  const refs = referencedAssetIds([{ ...page, elements }])
  const assets = s.project.assets.filter((a) => refs.has(a.id))
  return saveComposition(name, elements, assets, { id: s.project.id, title: s.project.title })
}
