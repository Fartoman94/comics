import { describe, expect, it } from 'vitest'
import { isTap, keyStep, pageLabel, swipeStep, tapStep, toBookIndex, toLogical, visiblePages } from '../../src/lib/readerNav'

const W = 400
describe('swipeStep: la misma dirección lógica en cómic y manga', () => {
  it('cómic (ltr): deslizar hacia la izquierda avanza, hacia la derecha retrocede', () => {
    expect(swipeStep({ dx: -120, dy: 5, dt: 200, width: W }, false)).toBe(1)
    expect(swipeStep({ dx: 120, dy: 5, dt: 200, width: W }, false)).toBe(-1)
  })
  it('manga (rtl): deslizar hacia la derecha avanza, hacia la izquierda retrocede', () => {
    expect(swipeStep({ dx: 120, dy: 5, dt: 200, width: W }, true)).toBe(1)
    expect(swipeStep({ dx: -120, dy: 5, dt: 200, width: W }, true)).toBe(-1)
  })
  it('ignora gestos cortos, verticales o lentos y cortos', () => {
    expect(swipeStep({ dx: -20, dy: 0, dt: 50, width: W }, false)).toBe(0)
    expect(swipeStep({ dx: -100, dy: 200, dt: 200, width: W }, false)).toBe(0)
    // arrastrar una esquina en diagonal hacia el centro sí cuenta
    expect(swipeStep({ dx: -300, dy: 260, dt: 150, width: W }, false)).toBe(1)
    expect(swipeStep({ dx: -50, dy: 0, dt: 2000, width: W }, false)).toBe(0)
    // lento pero largo (arrastrar la hoja) sí cuenta
    expect(swipeStep({ dx: -200, dy: 10, dt: 2000, width: W }, false)).toBe(1)
  })
})

describe('tapStep / isTap / keyStep', () => {
  it('tocar el costado de lectura avanza', () => {
    expect(tapStep(0.9, false)).toBe(1)
    expect(tapStep(0.1, false)).toBe(-1)
    expect(tapStep(0.1, true)).toBe(1)
    expect(tapStep(0.9, true)).toBe(-1)
    expect(tapStep(0.5, false)).toBe(0)
  })
  it('un toque es corto y casi quieto', () => {
    expect(isTap({ dx: 3, dy: 2, dt: 120 })).toBe(true)
    expect(isTap({ dx: 40, dy: 2, dt: 120 })).toBe(false)
  })
  it('flechas físicas según el sentido, PageDown/espacio siempre avanzan', () => {
    expect(keyStep('ArrowRight', false)).toBe(1)
    expect(keyStep('ArrowRight', true)).toBe(-1)
    expect(keyStep('ArrowLeft', true)).toBe(1)
    expect(keyStep(' ', true)).toBe(1)
    expect(keyStep('End', false)).toBe('last')
    expect(keyStep('a', false)).toBe(0)
  })
})

describe('índices y etiquetas', () => {
  it('libro y lectura son inversos en manga', () => {
    expect(toBookIndex(0, 6, true)).toBe(5)
    expect(toLogical(5, 6, true)).toBe(0)
    expect(toBookIndex(2, 6, false)).toBe(2)
  })
  it('pliegos con tapas: portada sola, [1,2], [3,4], contratapa sola', () => {
    expect(visiblePages(0, 6, false, true)).toEqual([0])
    expect(visiblePages(1, 6, false, true)).toEqual([1, 2])
    expect(visiblePages(2, 6, false, true)).toEqual([1, 2])
    expect(visiblePages(5, 6, false, true)).toEqual([5])
    expect(visiblePages(3, 6, false, false)).toEqual([3])
    // manga: el índice 0 del libro es la última página de la historia
    expect(visiblePages(0, 6, true, true)).toEqual([5])
    expect(visiblePages(5, 6, true, true)).toEqual([0])
  })
  it('"Página X de Y" consistente', () => {
    expect(pageLabel([0], 6)).toBe('Página 1 de 6')
    expect(pageLabel([1, 2], 6)).toBe('Páginas 2–3 de 6')
  })
})
