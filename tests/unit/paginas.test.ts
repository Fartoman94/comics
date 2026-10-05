import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/textFit', () => ({ measureTextHeight: () => 0 }))

const { useEditor, nextPageName } = await import('../../src/store/editor')
const { createProject, createBubble } = await import('../../src/lib/factories')
const { buildTemplatePanels, TEMPLATES } = await import('../../src/lib/templates')

const S = () => useEditor.getState()

beforeEach(() => {
  S().closeProject()
  useEditor.setState({ toasts: [] })
})

describe('P02 · páginas', () => {
  it('10 páginas con ids estables (no índices) que sobreviven a reordenar, duplicar y eliminar', () => {
    const p = createProject({ title: 'diez', author: '', kind: 'comic', pages: 1 })
    S().openProject(p)
    for (let i = 0; i < 9; i++) S().addPage('grid-2x2')
    const ids = S().project!.pages.map((pg) => pg.id)
    expect(ids).toHaveLength(10)
    expect(new Set(ids).size).toBe(10)
    for (const id of ids) expect(id).toMatch(/^pg_/)
    S().movePage(9, 0)
    expect(S().project!.pages[0].id).toBe(ids[9])
    S().duplicatePage(ids[3])
    const dupIdx = S().project!.pages.findIndex((pg) => pg.id === ids[3]) + 1
    const dup = S().project!.pages[dupIdx]
    expect(dup.id).not.toBe(ids[3])
    expect(dup.elements.map((e) => e.id)).not.toEqual(S().project!.pages[dupIdx - 1].elements.map((e) => e.id))
    S().deletePage(ids[5])
    expect(S().project!.pages.map((pg) => pg.id)).not.toContain(ids[5])
    expect(S().project!.pages).toHaveLength(10)
  })

  it('nombres "Página N" sin repetir después de borrar', () => {
    expect(nextPageName([{ name: 'Portada' }, { name: 'Página 3' }])).toBe('Página 4')
    expect(nextPageName([{ name: 'Página 2' }])).toBe('Página 3')
    expect(nextPageName([{ name: 'A' }, { name: 'B' }])).toBe('Página 3')
  })

  it('renombrar recorta espacios, ignora vacío y agrupa el tipeo en un paso del historial', () => {
    const p = createProject({ title: 'ren', author: '', kind: 'comic', pages: 2 })
    S().openProject(p)
    const id = p.pages[1].id
    S().renamePage(id, '  Ca')
    S().renamePage(id, '  Capítulo 1  ')
    expect(S().project!.pages[1].name).toBe('Capítulo 1')
    S().renamePage(id, '   ')
    expect(S().project!.pages[1].name).toBe('Capítulo 1')
    S().undo()
    expect(S().project!.pages[1].name).toBe(p.pages[1].name)
  })

  it('copiar contenido a otras páginas: ids nuevos, se suma a lo que había, un solo deshacer', () => {
    const p = createProject({ title: 'copiar', author: '', kind: 'comic', pages: 3, templateId: null })
    p.pages[1].elements = [...buildTemplatePanels(TEMPLATES.find((t) => t.id === 'two-rows')!, p.format, 40, 20), createBubble('speech', 100, 100)]
    p.pages[2].elements = [createBubble('shout', 10, 10)]
    S().openProject(p)
    S().copyPageContentTo(p.pages[1].id, [p.pages[2].id, p.pages[0].id, p.pages[1].id])
    const pages = S().project!.pages
    expect(pages[2].elements).toHaveLength(4)
    expect(pages[0].elements.length).toBe(p.pages[0].elements.length + 3)
    const srcIds = new Set(pages[1].elements.map((e) => e.id))
    for (const e of pages[2].elements) expect(srcIds.has(e.id)).toBe(false)
    expect(pages[1].elements).toHaveLength(3)
    S().undo()
    expect(S().project!.pages[2].elements).toHaveLength(1)
  })

  it('goToPage se ajusta al rango', () => {
    const p = createProject({ title: 'ir', author: '', kind: 'comic', pages: 4 })
    S().openProject(p)
    S().goToPage(99)
    expect(S().pageId).toBe(p.pages[3].id)
    S().goToPage(-3)
    expect(S().pageId).toBe(p.pages[0].id)
  })

  it('layouts: splash, manga y 6 clásico crean viñetas editables (no imágenes)', () => {
    const p = createProject({ title: 'lay', author: '', kind: 'comic', pages: 1, templateId: null })
    S().openProject(p)
    for (const [id, n] of [['splash', 1], ['manga-dynamic', 5], ['classic-6', 6], ['two-cols', 2], ['three-mixed', 3]] as const) {
      S().applyTemplate(id, 40, 18, 'replace')
      const els = S().project!.pages[0].elements.filter((e) => e.type === 'panel')
      expect(els).toHaveLength(n)
    }
  })
})
