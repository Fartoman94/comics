import { useEffect, useRef, useState } from 'react'
import { useFocusTrap } from '../../ui/useFocusTrap'
import { X } from 'lucide-react'

/**
 * Hoja inferior para celular: título, manija para arrastrar y cerrar, botón cerrar de 44 px,
 * altura máxima segura y respeto de la zona segura del dispositivo.
 */
export function BottomSheet({ title, onClose, children, onBodyClick, labelledBy }: { title: string; onClose: () => void; children: React.ReactNode; onBodyClick?: (e: React.MouseEvent) => void; labelledBy?: string }) {
  const [dy, setDy] = useState(0)
  const start = useRef<number | null>(null)
  const box = useRef<HTMLDivElement>(null)
  useFocusTrap(box)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const end = () => {
    if (start.current === null) return
    start.current = null
    if (dy > 80) onClose()
    setDy(0)
  }
  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={box}
        tabIndex={-1}
        aria-modal="true"
        className="fixed inset-x-0 bottom-0 z-40 flex outline-none max-h-[min(75dvh,calc(100dvh-4rem))] flex-col rounded-t-2xl border-t border-ink-600 bg-ink-850 shadow-2xl transition-transform"
        style={{ transform: dy ? `translateY(${dy}px)` : undefined, transitionDuration: dy ? '0ms' : undefined }}
        role="dialog"
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
      >
        <div
          className="flex cursor-grab touch-none flex-col items-stretch pt-2"
          onPointerDown={(e) => {
            start.current = e.clientY
            e.currentTarget.setPointerCapture(e.pointerId)
          }}
          onPointerMove={(e) => start.current !== null && setDy(Math.max(0, e.clientY - start.current))}
          onPointerUp={end}
          onPointerCancel={end}
        >
          <div className="mx-auto h-1 w-10 rounded-full bg-ink-500" aria-hidden="true" />
          <div className="flex items-center justify-between border-b border-ink-700 px-4 pt-1 pb-1">
            <h2 className="text-sm font-semibold text-fg">{title}</h2>
            <button onClick={onClose} onPointerDown={(e) => e.stopPropagation()} className="-mr-2 flex size-11 items-center justify-center rounded-lg text-ink-200 hover:bg-ink-700" aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]" onClick={onBodyClick}>
          {children}
        </div>
      </div>
    </>
  )
}
