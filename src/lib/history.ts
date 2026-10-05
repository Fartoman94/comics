import type { ComicElement, Page, Project } from '../types'

/** Lo que guarda el historial: el documento sin recursos ni miniatura. */
export type HistorySnapshot = Omit<Project, 'assets' | 'thumbnail'>

const GEOMETRY = new Set(['x', 'y'])
const SIZE = new Set(['width', 'height'])
const IGNORED = new Set(['updatedAt'])

const name = (e: ComicElement) => e.name || 'elemento'
const list = (els: ComicElement[]) => (els.length === 1 ? name(els[0]) : `${els.length} elementos`)

function changedKeys(a: ComicElement, b: ComicElement): string[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  return [...keys].filter((k) => (a as unknown as Record<string, unknown>)[k] !== (b as unknown as Record<string, unknown>)[k])
}

function describeElement(a: ComicElement, b: ComicElement): string {
  const keys = changedKeys(a, b)
  const only = (set: Set<string>) => keys.length > 0 && keys.every((k) => set.has(k))
  if (only(GEOMETRY)) return `Moviste ${name(b)}`
  if (keys.every((k) => GEOMETRY.has(k) || SIZE.has(k) || k === 'fontSize' || k === 'tailX' || k === 'tailY' || k === 'image')) {
    if (keys.some((k) => SIZE.has(k))) return `Cambiaste el tamaño de ${name(b)}`
  }
  if (keys.length === 1) {
    const [k] = keys
    if (k === 'text') return `Editaste el texto de ${name(b)}`
    if (k === 'hidden') return `${b.hidden ? 'Ocultaste' : 'Mostraste'} ${name(b)}`
    if (k === 'locked') return `${b.locked ? 'Bloqueaste' : 'Desbloqueaste'} ${name(b)}`
    if (k === 'name') return `Renombraste ${name(a)} a ${name(b)}`
    if (k === 'rotation') return `Giraste ${name(b)}`
    if (k === 'opacity') return `Cambiaste la opacidad de ${name(b)}`
    if (k === 'tailX' || k === 'tailY') return `Moviste la cola de ${name(b)}`
    if (k === 'image' || k === 'assetId') {
      const had = a.type === 'panel' ? !!a.image : true
      const has = b.type === 'panel' ? !!b.image : true
      if (!had && has) return `Pusiste una imagen en ${name(b)}`
      if (had && !has) return `Quitaste la imagen de ${name(b)}`
      return `Cambiaste la imagen de ${name(b)}`
    }
    if (k === 'fill' || k === 'stroke' || k === 'textColor' || k === 'color') return `Cambiaste el color de ${name(b)}`
  }
  if (keys.every((k) => k === 'tailX' || k === 'tailY')) return `Moviste la cola de ${name(b)}`
  return `Cambiaste ${name(b)}`
}

function describePage(a: Page, b: Page, pageNumber: number): string | null {
  const before = new Map(a.elements.map((e) => [e.id, e]))
  const after = new Map(b.elements.map((e) => [e.id, e]))
  const added = b.elements.filter((e) => !before.has(e.id))
  const removed = a.elements.filter((e) => !after.has(e.id))
  if (added.length && removed.length && added.length + removed.length > 2) return `Cambiaste la plantilla de la página ${pageNumber}`
  if (added.length && removed.length) return `Reemplazaste ${list(removed)} por ${list(added)}`
  if (added.length === 1 && added[0].type === 'panel') {
    // Dividir: aparece una viñeta y otra existente cambia de tamaño.
    const resized = b.elements.find((e) => e.type === 'panel' && before.get(e.id) && before.get(e.id) !== e && changedKeys(before.get(e.id)!, e).some((k) => SIZE.has(k)))
    if (resized) return `Dividiste ${name(before.get(resized.id)!)}`
  }
  if (added.length) return added.length > 1 && added.every((e) => e.type === 'panel') ? `Aplicaste ${added.length} viñetas` : `Agregaste ${list(added)}`
  if (removed.length) return `Eliminaste ${list(removed)}`
  const changed = b.elements.filter((e) => before.get(e.id) !== e)
  if (changed.length === 1) return describeElement(before.get(changed[0].id)!, changed[0])
  if (changed.length > 1) {
    const allMoved = changed.every((e) => changedKeys(before.get(e.id)!, e).every((k) => GEOMETRY.has(k)))
    return allMoved ? `Moviste ${list(changed)}` : `Cambiaste ${list(changed)}`
  }
  const orderChanged = a.elements.some((e, i) => b.elements[i]?.id !== e.id)
  if (orderChanged) return `Cambiaste el orden de las capas`
  if (a.background !== b.background) return `Cambiaste el fondo de la página ${pageNumber}`
  if (a.name !== b.name) return `Renombraste la página ${pageNumber}`
  return null
}

/**
 * Frase corta para el historial ("Moviste Imagen 2", "Duplicaste…", "Eliminaste la página 3")
 * a partir de dos estados. No hace falta etiquetar cada acción: se compara lo que cambió.
 */
export function describeChange(prev: HistorySnapshot, next: HistorySnapshot): string {
  const a = new Map(prev.pages.map((p, i) => [p.id, { p, i }]))
  const b = new Map(next.pages.map((p, i) => [p.id, { p, i }]))
  const addedPages = next.pages.filter((p) => !a.has(p.id))
  const removedPages = prev.pages.filter((p) => !b.has(p.id))
  if (addedPages.length) return addedPages.length === 1 ? `Agregaste la página ${next.pages.indexOf(addedPages[0]) + 1}` : `Agregaste ${addedPages.length} páginas`
  if (removedPages.length) return removedPages.length === 1 ? `Eliminaste la página ${a.get(removedPages[0].id)!.i + 1}` : `Eliminaste ${removedPages.length} páginas`
  if (prev.pages.some((p, i) => next.pages[i]?.id !== p.id)) return 'Reordenaste las páginas'
  for (const p of next.pages) {
    const old = a.get(p.id)!.p
    if (old === p) continue
    const d = describePage(old, p, b.get(p.id)!.i + 1)
    if (d) return d
  }
  if (prev.title !== next.title) return 'Cambiaste el título'
  if (prev.readingDirection !== next.readingDirection) return 'Cambiaste el sentido de lectura'
  if (prev.script !== next.script) return 'Editaste el guion'
  const keys = Object.keys(next).filter((k) => !IGNORED.has(k) && (prev as unknown as Record<string, unknown>)[k] !== (next as unknown as Record<string, unknown>)[k])
  if (keys.includes('author') || keys.includes('synopsis')) return 'Editaste los datos de la obra'
  return 'Cambio'
}
