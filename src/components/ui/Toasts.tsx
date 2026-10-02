import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useEditor } from '../../store/editor'
import { cx } from './controls'

export function Toasts() {
  const toasts = useEditor((s) => s.toasts)
  const dismiss = useEditor((s) => s.dismissToast)
  return (
    // Por encima de la barra inferior en el editor (--toast-offset) y de la zona segura del dispositivo.
    <div className="pointer-events-none fixed bottom-[calc(var(--toast-offset,1.25rem)+env(safe-area-inset-bottom))] left-1/2 z-[60] flex w-[min(92vw,32rem)] -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === 'error' ? 'alert' : 'status'}
          className={cx(
            'pointer-events-auto flex max-w-full items-center gap-2 rounded-xl border py-1.5 pr-1.5 pl-4 text-sm shadow-2xl backdrop-blur',
            t.tone === 'error' ? 'border-red-500/30 bg-red-950/90 text-red-100' : t.tone === 'success' ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-100' : 'border-ink-600 bg-ink-800/95 text-ink-100',
          )}
        >
          <button onClick={() => dismiss(t.id)} className="flex items-center gap-2 text-left">
            {t.tone === 'error' ? <XCircle size={16} className="shrink-0" /> : t.tone === 'success' ? <CheckCircle2 size={16} className="shrink-0" /> : <Info size={16} className="shrink-0" />}
            {t.message}
          </button>
          {t.action && (
            <button
              onClick={() => {
                dismiss(t.id)
                t.action!.run()
              }}
              className="ml-1 shrink-0 rounded-md bg-white/15 px-2.5 py-1 text-xs font-semibold hover:bg-white/25"
            >
              {t.action.label}
            </button>
          )}
          <button onClick={() => dismiss(t.id)} aria-label="Cerrar aviso" className="flex size-9 shrink-0 items-center justify-center rounded-lg opacity-70 hover:bg-white/10 hover:opacity-100">
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  )
}
