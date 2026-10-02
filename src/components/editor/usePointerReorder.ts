import { useState } from 'react'

/**
 * Reordenar con una manija usando Pointer Events (mouse, dedo y lápiz por igual) y con el teclado.
 * Los elementos de la lista llevan `data-reorder-index`.
 */
export function usePointerReorder(onMove: (from: number, to: number) => void) {
  const [drag, setDrag] = useState<{ from: number; over: number } | null>(null)
  const overFrom = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-reorder-index]')
    return el ? Number(el.dataset.reorderIndex) : null
  }
  const handleProps = (index: number, total: number) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      setDrag({ from: index, over: index })
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (!drag) return
      const over = overFrom(e.clientX, e.clientY)
      if (over !== null && over !== drag.over) setDrag({ ...drag, over })
    },
    onPointerUp: () => {
      if (drag && drag.over !== drag.from) onMove(drag.from, drag.over)
      setDrag(null)
    },
    onPointerCancel: () => setDrag(null),
    onKeyDown: (e: React.KeyboardEvent) => {
      const back = e.key === 'ArrowLeft' || e.key === 'ArrowUp'
      const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown'
      if (!back && !fwd) return
      e.preventDefault()
      e.stopPropagation()
      const to = index + (fwd ? 1 : -1)
      if (to >= 0 && to < total) onMove(index, to)
    },
    style: { touchAction: 'none' } as React.CSSProperties,
  })
  return { drag, handleProps }
}
