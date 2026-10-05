import type { ComicElement, Page, PanelElement } from '../types'
import { pointInPolygon } from './geometry'
import { panelPolygon } from './panelOps'

export const TYPE_LABEL: Record<ComicElement['type'], string> = {
  panel: 'Viñeta',
  image: 'Imagen',
  bubble: 'Globo',
  text: 'Texto',
  effect: 'Efecto',
  drawing: 'Capa de dibujo',
  shape: 'Forma',
}

/**
 * Viñeta que "contiene" a un elemento: la de más arriba en la pila que está por debajo del
 * elemento y tiene su centro adentro. Las viñetas y capas de dibujo no tienen viñeta padre.
 * (El documento guarda los elementos planos por página; la jerarquía se deduce por geometría
 * para no romper los .vineta existentes.)
 */
export function parentPanelOf(page: Page, el: ComicElement): PanelElement | undefined {
  if (el.type === 'panel' || el.type === 'drawing') return undefined
  const at = page.elements.indexOf(el)
  const c = { x: el.x + el.width / 2, y: el.y + el.height / 2 }
  for (let i = (at < 0 ? page.elements.length : at) - 1; i >= 0; i--) {
    const p = page.elements[i]
    if (p.type === 'panel' && pointInPolygon(c, panelPolygon(p))) return p
  }
  return undefined
}

/** Elementos (no viñetas) cuyo padre es la viñeta dada. */
export function childrenOf(page: Page, panel: PanelElement): ComicElement[] {
  return page.elements.filter((e) => e.type !== 'panel' && e.type !== 'drawing' && parentPanelOf(page, e)?.id === panel.id)
}

/** Número visible de una viñeta en su página (1, 2, 3…), en el orden de la pila. */
export function panelNumber(page: Page, panel: PanelElement): number {
  return page.elements.filter((e) => e.type === 'panel').indexOf(panel) + 1
}

/**
 * Ids a mover juntos: los pedidos más el contenido de cada viñeta pedida (globos, textos,
 * imágenes encima). Lo bloqueado u oculto no se suma.
 */
export function withPanelContent(page: Page, ids: string[]): string[] {
  const out = new Set(ids)
  for (const id of ids) {
    const el = page.elements.find((e) => e.id === id)
    if (el?.type !== 'panel') continue
    for (const c of childrenOf(page, el)) if (!c.locked && !c.hidden) out.add(c.id)
  }
  return [...out]
}
