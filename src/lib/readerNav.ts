// Navegación del lector, independiente de la librería de animación. "Lógico" = orden de lectura
// (índice de la página en el proyecto). En manga (rtl) el libro se arma al revés: el índice del
// libro es N-1-lógico. Avanzar (+1) siempre es ir a la página siguiente de la historia.

export type Step = 1 | -1 | 0

export const toBookIndex = (logical: number, n: number, rtl: boolean) => (rtl ? n - 1 - logical : logical)
export const toLogical = (book: number, n: number, rtl: boolean) => (rtl ? n - 1 - book : book)

/** Gesto de arrastre/deslizamiento. En un libro occidental se avanza tirando la hoja hacia la izquierda; en manga, hacia la derecha. */
export function swipeStep(g: { dx: number; dy: number; dt: number; width: number }, rtl: boolean): Step {
  const { dx, dy, dt, width } = g
  const dist = Math.abs(dx)
  // El libro no tiene scroll vertical: se aceptan gestos diagonales (arrastrar una esquina hacia el centro).
  if (dist < 40 || dist < Math.abs(dy) * 0.7) return 0
  const fast = dist / Math.max(dt, 1) > 0.35 // px/ms
  if (!fast && dist < width * 0.18) return 0
  const towardLeft = dx < 0
  return (towardLeft !== rtl ? 1 : -1) as Step
}

export const isTap = (g: { dx: number; dy: number; dt: number }) => Math.hypot(g.dx, g.dy) < 12 && g.dt < 400

/** Tocar el costado: el lado "hacia donde se lee" avanza (derecha en cómic, izquierda en manga). */
export function tapStep(xRatio: number, rtl: boolean): Step {
  if (xRatio > 0.38 && xRatio < 0.62) return 0
  const right = xRatio >= 0.62
  return (right !== rtl ? 1 : -1) as Step
}

/** Flechas físicas: → va hacia la derecha del libro (avanza en cómic, retrocede en manga). */
export function keyStep(key: string, rtl: boolean): Step | 'first' | 'last' {
  switch (key) {
    case 'ArrowRight':
      return rtl ? -1 : 1
    case 'ArrowLeft':
      return rtl ? 1 : -1
    case 'PageDown':
    case ' ':
      return 1
    case 'PageUp':
      return -1
    case 'Home':
      return 'first'
    case 'End':
      return 'last'
    default:
      return 0
  }
}

/**
 * Páginas lógicas visibles para el índice de libro actual. Con tapas (showCover) el libro abierto
 * muestra la portada sola, después pliegos [1,2], [3,4]… y la contratapa sola si queda impar.
 */
export function visiblePages(bookIndex: number, n: number, rtl: boolean, spread: boolean): number[] {
  let pages: number[]
  if (!spread || bookIndex === 0) pages = [bookIndex]
  else {
    const left = bookIndex % 2 === 1 ? bookIndex : bookIndex - 1
    pages = [left, left + 1].filter((i) => i < n)
  }
  return pages.map((b) => toLogical(b, n, rtl)).sort((a, b) => a - b)
}

/** "Página 3 de 6" / "Páginas 2–3 de 6" (siempre en números de lectura). */
export function pageLabel(logicalPages: number[], n: number) {
  const nums = logicalPages.map((i) => i + 1)
  return nums.length > 1 ? `Páginas ${nums[0]}–${nums[nums.length - 1]} de ${n}` : `Página ${nums[0]} de ${n}`
}

/** Pliegos en orden de lectura (previsualización): portada sola, después de a dos. */
export function spreadOf(i: number, n: number) {
  if (i === 0) return [0]
  const left = i % 2 === 1 ? i : i - 1
  return [left, left + 1].filter((x) => x < n)
}
