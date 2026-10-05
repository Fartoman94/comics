import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/textFit', () => ({ measureTextHeight: () => 0 }))

const { useEditor } = await import('../../src/store/editor')
const { createProject, createBubble, createImage } = await import('../../src/lib/factories')
const { STARTER_TEMPLATES, TEMPLATES, TEMPLATE_META, buildTemplatePanels, formatShape } = await import('../../src/lib/templates')
const { getFormat } = await import('../../src/lib/formats')

const S = () => useEditor.getState()
beforeEach(() => S().closeProject())

describe('P11 · plantillas y tipos de proyecto', () => {
  it('plantillas iniciales: todas existen y tienen explicación', () => {
    expect(STARTER_TEMPLATES.map((t) => t.name)).toEqual(['Cómic clásico', 'Manga', 'Webtoon', 'Storyboard', 'Tira de 3 viñetas', 'Página splash', 'Página libre'])
    for (const t of STARTER_TEMPLATES) {
      if (t.id) expect(TEMPLATES.some((x) => x.id === t.id)).toBe(true)
      expect(t.use.length).toBeGreaterThan(10)
    }
  })

  it('storyboard: formato A4 apaisado y 6 cuadros 16:9 con lugar para notas', () => {
    const f = getFormat('storyboard')
    expect(f.width).toBeGreaterThan(f.height)
    expect(formatShape(f)).toBe('horizontal')
    const tpl = TEMPLATES.find((t) => t.id === 'storyboard-6')!
    expect(TEMPLATE_META[tpl.id].shape).toBe('horizontal')
    const panels = buildTemplatePanels(tpl, f, f.margin, 20)
    expect(panels).toHaveLength(6)
    for (const p of panels) {
      expect(p.width / p.height).toBeGreaterThan(1.6)
      expect(p.width / p.height).toBeLessThan(1.95)
    }
  })

  it('cambiar de plantilla no borra los recursos del proyecto ni rompe el historial', () => {
    const p = createProject({ title: 'tpl', author: '', kind: 'comic', pages: 2 })
    p.assets = [{ id: 'as_x', name: 'x', width: 10, height: 10, mime: 'image/png', createdAt: 0 }]
    const pg = p.pages[1]
    const panel0 = pg.elements.find((e) => e.type === 'panel')! as Extract<(typeof pg.elements)[number], { type: 'panel' }>
    panel0.image = { assetId: 'as_x', x: 0, y: 0, scale: 1, filters: { grayscale: false, sepia: false, invert: false, brightness: 0, contrast: 0, threshold: 0, blur: 0 } }
    pg.elements.push(createBubble('speech', 10, 10), createImage('as_x', 0, 0, 10, 10))
    S().openProject(p)
    S().setPage(pg.id)
    const before = JSON.stringify(S().project!.pages[1])
    S().applyTemplate('manga-dynamic', 40, 18, 'replace')
    const after = S().project!.pages[1].elements
    expect(after.filter((e) => e.type === 'panel')).toHaveLength(5)
    expect(after.filter((e) => e.type !== 'panel')).toHaveLength(2)
    expect(S().project!.assets.map((a) => a.id)).toEqual(['as_x'])
    // La imagen encuadrada pasa a la primera viñeta nueva.
    expect(after.find((e) => e.type === 'panel' && e.image)).toBeTruthy()
    S().undo()
    expect(JSON.stringify(S().project!.pages[1])).toBe(before)
    S().redo()
    expect(S().project!.pages[1].elements.filter((e) => e.type === 'panel')).toHaveLength(5)
  })

  it('diseño en bloque: bordes y tipografía para la página o para todo el proyecto (sin tocar lo bloqueado)', () => {
    const p = createProject({ title: 'dis', author: '', kind: 'comic', pages: 3 })
    p.pages[1].elements.push(createBubble('speech', 0, 0))
    p.pages[2].elements.push(createBubble('speech', 0, 0))
    p.pages[1].elements[0].locked = true
    S().openProject(p)
    S().setPage(p.pages[1].id)
    S().applyDesign({ panelStrokeWidth: 12, panelStroke: '#ff0000' }, 'page')
    const w = (i: number) => S().project!.pages[i].elements.filter((e) => e.type === 'panel').map((e) => (e.type === 'panel' ? e.strokeWidth : 0))
    expect(w(1).slice(1).every((v) => v === 12)).toBe(true)
    expect(w(1)[0]).not.toBe(12)
    expect(w(2).every((v) => v !== 12)).toBe(true)
    S().applyDesign({ bubbleFont: 'Bangers' }, 'project')
    expect(S().project!.pages.flatMap((pg) => pg.elements).filter((e) => e.type === 'bubble').every((e) => e.type === 'bubble' && e.fontFamily === 'Bangers')).toBe(true)
    expect(S().past).toHaveLength(2)
  })
})
