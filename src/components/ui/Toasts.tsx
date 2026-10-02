import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { useEditor } from '../../store/editor'
import { cx } from './controls'

export function Toasts() {
  const toasts = useEditor((s) => s.toasts)
  const dismiss = useEditor((s) => s.dismissToast)
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === 'error' ? 'alert' : 'status'}
          className={cx(
            'pointer-events-auto flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm shadow-2xl backdrop-blur',
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
        </div>
      ))}
    </div>
  )
}
