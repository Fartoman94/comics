import type { BubbleElement } from '../types'
import { measureTextHeight } from './textFit'
import { isBoxBubble } from './factories'

/** Proporción del rectángulo de texto dentro del globo (ver bubbleTextBox). */
function inner(shape: BubbleElement['shape']) {
  return shape === 'impact' ? 0.6 : isBoxBubble(shape) ? 1 : 0.72
}

/**
 * Tamaño de globo para que el texto entre cómodo: el ancho sale de la cantidad de texto (más
 * ancho que alto, como se rotula a mano) y el alto se mide con la tipografía real.
 * Devuelve null si no hay medidor de texto (fuera del editor).
 */
export function fitBubbleSize(b: BubbleElement, opts: { maxWidth?: number } = {}): { width: number; height: number } | null {
  const k = inner(b.shape)
  const padF = isBoxBubble(b.shape) ? 2 : 0.6
  const text = b.uppercase ? b.text.toUpperCase() : b.text
  const longest = Math.max(1, ...text.split('\n').map((l) => [...l].length))
  const chars = [...text].length
  // Ancho de texto ideal: ~22 caracteres por línea, nunca menos que la palabra más larga.
  const longestWord = Math.max(1, ...text.split(/\s+/).map((w) => [...w].length))
  const perLine = Math.min(longest, Math.max(longestWord + 1, Math.min(22, Math.ceil(Math.sqrt(chars * 2.6)))))
  let tw = perLine * b.fontSize * 0.6 + b.letterSpacing * perLine
  if (opts.maxWidth) tw = Math.min(tw, opts.maxWidth * k - b.padding * padF)
  const th = measureTextHeight({ text: b.text, width: tw, fontFamily: b.fontFamily, fontSize: b.fontSize, fontStyle: b.fontStyle, lineHeight: b.lineHeight, letterSpacing: b.letterSpacing, uppercase: b.uppercase })
  if (!th) return null
  const width = Math.round((tw + b.padding * padF) / k)
  const height = Math.round((th + b.padding * padF) / k)
  return { width: Math.max(width, Math.round(b.fontSize * 3)), height: Math.max(height, Math.round(b.fontSize * 2)) }
}
