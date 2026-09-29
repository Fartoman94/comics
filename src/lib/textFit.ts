import Konva from 'konva'
import type { TextElement } from '../types'

/** Alto necesario para que un texto horizontal entre completo en su ancho actual. */
export function measureTextHeight(el: Pick<TextElement, 'text' | 'width' | 'fontFamily' | 'fontSize' | 'fontStyle' | 'lineHeight' | 'letterSpacing' | 'uppercase'>) {
  const t = new Konva.Text({
    text: el.uppercase ? el.text.toUpperCase() : el.text,
    width: el.width,
    fontFamily: el.fontFamily,
    fontSize: el.fontSize,
    fontStyle: el.fontStyle,
    lineHeight: el.lineHeight,
    letterSpacing: el.letterSpacing,
    wrap: 'word',
  })
  const h = t.height()
  t.destroy()
  return Math.ceil(h + el.fontSize * 0.25)
}
