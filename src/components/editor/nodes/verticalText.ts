import type { TextStyle } from '../../../types'

// Caracteres que en escritura vertical japonesa se giran 90°.
const ROTATE = new Set('ー―—–-~～…‥「」『』（）()[]［］〈〉《》【】｛｝{}〜=＝→←'.split(''))
// Puntuación que se ubica arriba a la derecha de su celda.
const CORNER = new Set('、。，．,.'.split(''))
const SMALL = new Set('ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ'.split(''))

interface Box {
  x: number
  y: number
  width: number
  height: number
}

interface Opts extends Pick<TextStyle, 'text' | 'fontFamily' | 'fontSize' | 'fontStyle' | 'lineHeight' | 'letterSpacing' | 'align' | 'uppercase'> {
  fill: string
  stroke?: string
  strokeWidth?: number
}

/** Layout tategaki: columnas de derecha a izquierda, caracteres de arriba hacia abajo. */
export function layoutVertical(o: Opts, box: Box) {
  const text = o.uppercase ? o.text.toUpperCase() : o.text
  const step = o.fontSize + o.letterSpacing
  const perCol = Math.max(1, Math.floor(box.height / step))
  const cols: string[][] = []
  for (const para of text.split('\n')) {
    const chars = [...para]
    if (!chars.length) cols.push([])
    for (let i = 0; i < chars.length; i += perCol) cols.push(chars.slice(i, i + perCol))
  }
  const colW = o.fontSize * Math.max(1, o.lineHeight) * 1.08
  const blockW = cols.length * colW
  return { cols, colW, step, blockW, startX: box.x + (box.width + blockW) / 2 - colW / 2 }
}

export function drawVerticalText(ctx: CanvasRenderingContext2D, o: Opts, box: Box) {
  const { cols, colW, step, startX } = layoutVertical(o, box)
  const weight = o.fontStyle.includes('bold') ? '700' : '400'
  const italic = o.fontStyle.includes('italic') ? 'italic ' : ''
  ctx.save()
  ctx.font = `${italic}${weight} ${o.fontSize}px "${o.fontFamily}"`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.fillStyle = o.fill
  cols.forEach((col, ci) => {
    const x = startX - ci * colW
    const colH = col.length * step
    const top = o.align === 'center' ? box.y + (box.height - colH) / 2 : o.align === 'right' ? box.y + box.height - colH : box.y
    col.forEach((ch, i) => {
      let cx = x
      let cy = top + i * step + step / 2
      ctx.save()
      if (CORNER.has(ch)) {
        cx += o.fontSize * 0.32
        cy -= o.fontSize * 0.32
      } else if (SMALL.has(ch)) {
        cx += o.fontSize * 0.1
        cy -= o.fontSize * 0.08
      }
      ctx.translate(cx, cy)
      if (ROTATE.has(ch)) ctx.rotate(Math.PI / 2)
      if (o.stroke && o.strokeWidth) {
        ctx.strokeStyle = o.stroke
        ctx.lineWidth = o.strokeWidth * 2
        ctx.strokeText(ch, 0, 0)
      }
      ctx.fillText(ch, 0, 0)
      ctx.restore()
    })
  })
  ctx.restore()
}
