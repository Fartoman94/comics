import { describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/textFit', () => ({ measureTextHeight: () => 0 }))

const { createPanel, createBubble, createShape, createDrawing } = await import('../../src/lib/factories')
const { buildLayerTree } = await import('../../src/components/editor/sidebar/LayersPanel')
import type { Page } from '../../src/types'

describe('P06 · árbol de capas Página > Viñeta > elementos', () => {
  it('anida el contenido de cada viñeta y ordena de adelante hacia atrás', () => {
    const a = createPanel(0, 0, 300, 300)
    const b = createPanel(400, 0, 300, 300)
    const d = createDrawing(800, 400)
    const inA1 = createBubble('speech', 20, 20, 0.3)
    const inA2 = createShape('heart', 100, 100, 60)
    const free = createShape('star', 350, 350, 30)
    const page: Page = { id: 'p', name: 'P', background: '#fff', elements: [a, b, inA1, d, inA2, free] }
    const tree = buildLayerTree(page)
    expect(tree.map((n) => n.el.id)).toEqual([free.id, d.id, b.id, a.id])
    const na = tree.find((n) => n.el.id === a.id)!
    expect(na.children.map((n) => n.el.id)).toEqual([inA2.id, inA1.id])
    expect(tree.find((n) => n.el.id === b.id)!.children).toEqual([])
  })

  it('30+ elementos: cada uno aparece exactamente una vez', () => {
    const panels = Array.from({ length: 6 }, (_, i) => createPanel((i % 2) * 400, Math.floor(i / 2) * 400, 380, 380))
    const kids = panels.flatMap((p) => Array.from({ length: 5 }, (_, k) => createShape('star', p.x + 20 + k * 40, p.y + 40, 30)))
    const page: Page = { id: 'p', name: 'P', background: '#fff', elements: [...panels, ...kids] }
    const tree = buildLayerTree(page)
    const flat = tree.flatMap((n) => [n.el.id, ...n.children.map((c) => c.el.id)])
    expect(flat).toHaveLength(36)
    expect(new Set(flat).size).toBe(36)
    expect(tree).toHaveLength(6)
  })
})
