import { describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/textFit', () => ({ measureTextHeight: () => 0 }))

const { createPanel, createProject, createBubble } = await import('../../src/lib/factories')
const { clipHalfPlane, coverCrop, detectShape, fitPanelImage, panelPolygon, shapeGeometry, splitPanel } = await import('../../src/lib/panelOps')
const { childrenOf, parentPanelOf, panelNumber } = await import('../../src/lib/hierarchy')
const { useEditor } = await import('../../src/store/editor')
const { QUICK_LAYOUTS, TEMPLATES } = await import('../../src/lib/templates')
import { DEFAULT_FILTERS } from '../../src/types'

describe('P01 · dividir viñetas', () => {
  it('horizontal: dos mitades apiladas con el medianil exacto entre ambas', () => {
    const p = createPanel(100, 100, 400, 600)
    const [a, b] = splitPanel(p, 'horizontal', 20)!
    expect(a.id).toBe(p.id)
    expect(b.id).not.toBe(p.id)
    expect([a.x, a.y, a.width, a.height]).toEqual([100, 100, 400, 290])
    expect([b.x, b.y, b.width, b.height]).toEqual([100, 410, 400, 290])
    expect(a.points).toBeNull()
    expect(b.points).toBeNull()
  })

  it('vertical: izquierda y derecha', () => {
    const [a, b] = splitPanel(createPanel(0, 0, 400, 300), 'vertical', 10)!
    expect([a.x, a.width]).toEqual([0, 195])
    expect([b.x, b.width]).toEqual([205, 195])
    expect(a.height).toBe(300)
  })

  it('diagonal: dos polígonos convexos que se pueden volver a dividir', () => {
    const [a, b] = splitPanel(createPanel(0, 0, 400, 400), 'diagonal', 10)!
    expect(a.points).not.toBeNull()
    expect(b.points).not.toBeNull()
    for (const v of [...a.points!, ...b.points!]) {
      expect(v).toBeGreaterThanOrEqual(-1e-6)
      expect(v).toBeLessThanOrEqual(1 + 1e-6)
    }
    expect(splitPanel(a, 'horizontal', 10)).not.toBeNull()
  })

  it('la imagen queda en la primera mitad, sin moverse en la página', () => {
    const p = createPanel(100, 100, 400, 400)
    p.image = { assetId: 'as_1', x: -10, y: -20, scale: 1, filters: { ...DEFAULT_FILTERS } }
    const [a, b] = splitPanel(p, 'vertical', 10)!
    expect(a.image?.assetId).toBe('as_1')
    expect(a.x + a.image!.x).toBe(p.x + p.image.x)
    expect(b.image).toBeNull()
  })

  it('no divide una viñeta demasiado chica', () => {
    expect(splitPanel(createPanel(0, 0, 40, 40), 'vertical', 10)).toBeNull()
  })

  it('clipHalfPlane recorta un cuadrado por la mitad', () => {
    const sq = panelPolygon(createPanel(0, 0, 10, 10))
    const half = clipHalfPlane(sq, 1, 0, 5)
    expect(Math.max(...half.map((p) => p.x))).toBeCloseTo(5)
    expect(half).toHaveLength(4)
  })
})

describe('P01 · forma y encaje', () => {
  it('detecta las formas predefinidas', () => {
    for (const s of ['rect', 'rounded', 'slant-right', 'slant-left', 'trapezoid'] as const) {
      expect(detectShape(shapeGeometry(s, 400))).toBe(s)
    }
    expect(detectShape({ points: [0, 0, 1, 0.5, 0, 1], cornerRadius: 0 })).toBeNull()
  })

  it('rellenar cubre el marco; ajustar muestra la imagen entera centrada', () => {
    const cover = fitPanelImage({ width: 200, height: 100 }, { width: 100, height: 100 }, 'cover')
    expect(cover.scale).toBe(2)
    expect(cover.y).toBe(-50)
    const contain = fitPanelImage({ width: 200, height: 100 }, { width: 100, height: 100 }, 'contain')
    expect(contain.scale).toBe(1)
    expect(contain.x).toBe(50)
  })

  it('coverCrop conserva la proporción de la caja', () => {
    const c = coverCrop({ width: 400, height: 200 }, 100, 100)
    expect(c).toEqual({ x: 100, y: 0, width: 200, height: 200 })
  })
})

describe('P01 · jerarquía Página > Viñeta > elemento', () => {
  it('un globo encima de una viñeta es su hijo; abajo de ella no', () => {
    const page = { id: 'pg', name: 'P', background: '#fff', elements: [] as ReturnType<typeof createPanel>[] } as never as import('../../src/types').Page
    const p1 = createPanel(0, 0, 100, 100)
    const p2 = createPanel(200, 0, 100, 100)
    const b = createBubble('speech', 20, 20, 0.1)
    page.elements.push(p1, p2, b)
    expect(parentPanelOf(page, b)?.id).toBe(p1.id)
    expect(childrenOf(page, p1).map((e) => e.id)).toEqual([b.id])
    expect(childrenOf(page, p2)).toEqual([])
    expect(panelNumber(page, p2)).toBe(2)
    page.elements = [b, p1, p2]
    expect(parentPanelOf(page, b)).toBeUndefined()
  })
})

describe('P01 · accesos rápidos y división desde el store', () => {
  it('todos los accesos rápidos apuntan a plantillas existentes', () => {
    for (const q of QUICK_LAYOUTS) if (q.id) expect(TEMPLATES.some((t) => t.id === q.id)).toBe(true)
    expect(QUICK_LAYOUTS.map((q) => q.label)).toEqual(['1 viñeta', '2 verticales', '2 horizontales', '3 viñetas', '4 clásico', '6 clásico', 'Página libre'])
  })

  it('splitPanel reemplaza la viñeta en su lugar de la pila y se deshace en un paso', () => {
    const p = createProject({ title: 'div', author: '', kind: 'libre', pages: 1 })
    const panel = createPanel(50, 50, 600, 600)
    p.pages[0].elements = [panel, createBubble('speech', 100, 100)]
    useEditor.getState().openProject(p)
    expect(useEditor.getState().splitPanel(panel.id, 'horizontal')).toBe(true)
    const els = useEditor.getState().project!.pages[0].elements
    expect(els.map((e) => e.type)).toEqual(['panel', 'panel', 'bubble'])
    useEditor.getState().undo()
    expect(useEditor.getState().project!.pages[0].elements).toHaveLength(2)
  })

  it('no divide una viñeta bloqueada', () => {
    const p = createProject({ title: 'lock', author: '', kind: 'libre', pages: 1 })
    const panel = { ...createPanel(0, 0, 600, 600), locked: true }
    p.pages[0].elements = [panel]
    useEditor.getState().openProject(p)
    expect(useEditor.getState().splitPanel(panel.id, 'vertical')).toBe(false)
    expect(useEditor.getState().project!.pages[0].elements).toHaveLength(1)
  })
})
