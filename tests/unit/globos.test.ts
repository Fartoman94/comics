import { describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/textFit', () => ({ measureTextHeight: () => 0 }))

const { createBubble, createProject, bubbleHasTail, isBoxBubble } = await import('../../src/lib/factories')
const { validateProject } = await import('../../src/lib/projectSchema')
const { bubbleTextBox } = await import('../../src/components/editor/nodes/bubblePath')
import type { BubbleShape } from '../../src/types'

const ALL: BubbleShape[] = ['speech', 'thought', 'shout', 'whisper', 'impact', 'borderless', 'box', 'rounded-box', 'cloud-box']

describe('P05 · tipos de globo', () => {
  it('los 9 tipos se crean con un estilo coherente', () => {
    const names = ALL.map((s) => createBubble(s, 0, 0).name)
    expect(names).toEqual(['Diálogo', 'Pensamiento', 'Grito', 'Susurro', 'Impacto', 'Sin borde', 'Narrador', 'Caja de narración', 'Recuadro nube'])
    expect(createBubble('borderless', 0, 0).strokeWidth).toBe(0)
    expect(createBubble('impact', 0, 0).fill).toBe('#ffd23f')
    expect(createBubble('rounded-box', 0, 0, 1).cornerRadius).toBe(18)
    expect(createBubble('box', 0, 0).cornerRadius).toBeUndefined()
  })

  it('cola sólo en las formas que la admiten; las cajas usan todo el ancho para el texto', () => {
    expect(ALL.filter(bubbleHasTail)).toEqual(['speech', 'thought', 'shout', 'whisper', 'impact', 'borderless'])
    expect(ALL.filter(isBoxBubble)).toEqual(['box', 'rounded-box'])
    const box = createBubble('rounded-box', 0, 0)
    const tb = bubbleTextBox(box)
    expect(tb.width).toBe(box.width - box.padding * 2)
    const imp = createBubble('impact', 0, 0)
    expect(bubbleTextBox(imp).width).toBeLessThan(bubbleTextBox({ ...imp, shape: 'speech' }).width)
  })

  it('el .vineta acepta las formas nuevas, el ancho de cola y el radio (y los viejos siguen igual)', () => {
    const p = createProject({ title: 'g', author: '', kind: 'libre', pages: 1, templateId: null })
    p.pages[0].elements = ALL.map((s) => ({ ...createBubble(s, 0, 0), tailWidth: 1.5 }))
    const out = validateProject(JSON.parse(JSON.stringify(p)))
    expect(out.pages[0].elements.map((e) => (e.type === 'bubble' ? e.shape : ''))).toEqual(ALL)
    expect(out.pages[0].elements[7]).toMatchObject({ cornerRadius: 18, tailWidth: 1.5 })
    const raw = JSON.parse(JSON.stringify(p))
    delete raw.pages[0].elements[0].tailWidth
    expect('tailWidth' in validateProject(raw).pages[0].elements[0]).toBe(false)
    raw.pages[0].elements[0].shape = 'corazon'
    expect(() => validateProject(raw)).toThrow()
  })
})
