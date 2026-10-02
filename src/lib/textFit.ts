import type { TextElement } from '../types'

type Measurable = Pick<TextElement, 'text' | 'width' | 'fontFamily' | 'fontSize' | 'fontStyle' | 'lineHeight' | 'letterSpacing' | 'uppercase'>

// La medición usa Konva, que sólo se carga con el editor (el inicio no la necesita).
let measurer: ((el: Measurable) => number) | null = null
export function setTextMeasurer(fn: (el: Measurable) => number) {
  measurer = fn
}

/** Alto necesario para que un texto horizontal entre completo en su ancho actual. */
export function measureTextHeight(el: Measurable) {
  return measurer ? measurer(el) : 0
}
