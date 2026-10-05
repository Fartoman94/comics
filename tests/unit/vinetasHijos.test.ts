import { describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/textFit', () => ({ measureTextHeight: () => 0 }))

const { createProject, createPanel, createShape, createBubble } = await import('../../src/lib/factories')
const { validateProject } = await import('../../src/lib/projectSchema')
const { withPanelContent } = await import('../../src/lib/hierarchy')
const { SHAPE_DEFS, shapeSvgPath, traceShape } = await import('../../src/lib/shapes')
import type { Page } from '../../src/types'

describe('P03 · formas y símbolos', () => {
  it('cada forma se crea con su caja y estilo, y su ícono SVG es válido', () => {
    for (const d of SHAPE_DEFS) {
      const el = createShape(d.id, 10, 20, 120)
      expect(el.type).toBe('shape')
      expect(el.shape).toBe(d.id)
      expect(Math.max(el.width, el.height)).toBe(120)
      expect(el.strokeWidth).toBeGreaterThan(0)
      expect(shapeSvgPath(d.cmds)).toMatch(/^M/)
    }
  })

  it('traceShape separa trazos y puntos (para símbolos de línea con punto relleno)', () => {
    const calls: string[] = []
    const ctx = new Proxy({}, { get: (_t, k) => () => calls.push(String(k)) }) as never
    const q = SHAPE_DEFS.find((d) => d.id === 'question')!
    traceShape(ctx, q.cmds, 100, 100, 'path')
    expect(calls).not.toContain('ellipse')
    calls.length = 0
    traceShape(ctx, q.cmds, 100, 100, 'dots')
    expect(calls).toEqual(['beginPath', 'moveTo', 'ellipse'])
  })

  it('el .vineta acepta formas y el margen interior de viñeta, y rechaza formas desconocidas', () => {
    const p = createProject({ title: 'formas', author: '', kind: 'comic', pages: 1 })
    const panel = { ...createPanel(0, 0, 300, 300), padding: 12 }
    p.pages[0].elements = [panel, createShape('heart', 20, 20, 80)]
    const ok = validateProject(JSON.parse(JSON.stringify(p)))
    expect(ok.pages[0].elements[0]).toMatchObject({ type: 'panel', padding: 12 })
    expect(ok.pages[0].elements[1]).toMatchObject({ type: 'shape', shape: 'heart' })
    const bad = JSON.parse(JSON.stringify(p))
    bad.pages[0].elements[1].shape = 'calavera'
    expect(() => validateProject(bad)).toThrow()
    // Un .vineta viejo sin padding sigue sin padding.
    const old = JSON.parse(JSON.stringify(p))
    delete old.pages[0].elements[0].padding
    expect('padding' in validateProject(old).pages[0].elements[0]).toBe(false)
  })
})

describe('P03 · la viñeta como contenedor', () => {
  it('mover una viñeta suma su contenido (no lo bloqueado/oculto ni lo de otras viñetas)', () => {
    const a = createPanel(0, 0, 300, 300)
    const b = createPanel(400, 0, 300, 300)
    const inA = createBubble('speech', 20, 20, 0.3)
    const lockedInA = { ...createShape('star', 100, 100, 50), locked: true }
    const hiddenInA = { ...createShape('heart', 150, 150, 50), hidden: true }
    const inB = createShape('music', 450, 50, 60)
    const page: Page = { id: 'pg', name: 'P', background: '#fff', elements: [a, b, inA, lockedInA, hiddenInA, inB] }
    expect(withPanelContent(page, [a.id]).sort()).toEqual([a.id, inA.id].sort())
    expect(withPanelContent(page, [inA.id])).toEqual([inA.id])
    expect(withPanelContent(page, [a.id, b.id]).sort()).toEqual([a.id, b.id, inA.id, inB.id].sort())
  })
})
