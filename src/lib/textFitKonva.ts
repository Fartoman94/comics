import Konva from 'konva'
import { setTextMeasurer } from './textFit'

// Se importa desde el editor: registra la medición de texto con Konva.
setTextMeasurer((el) => {
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
})
