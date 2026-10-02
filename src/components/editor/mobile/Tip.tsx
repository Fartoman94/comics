import { Lightbulb } from 'lucide-react'
import { useUi } from '../../../store/ui'

/**
 * Microayuda contextual: aparece la primera vez que se usa una función, dentro del propio panel
 * (nunca tapa lo que explica ni atrapa a la persona).
 */
export function Tip({ id, children }: { id: string; children: React.ReactNode }) {
  const seen = useUi((s) => s.tipsOff || s.tipsSeen.includes(id))
  if (seen) return null
  const { dismissTip, disableTips } = useUi.getState()
  return (
    <div className="m-3 rounded-xl border border-accent/50 bg-ink-850 p-3 text-xs leading-relaxed text-ink-100 shadow-xl" role="note" data-tip={id}>
      <div className="flex gap-2">
        <Lightbulb size={16} className="mt-0.5 shrink-0 text-accent-bright" aria-hidden="true" />
        <p>{children}</p>
      </div>
      <div className="mt-2 flex flex-wrap justify-end gap-1">
        <button onClick={disableTips} className="min-h-11 rounded-lg px-3 text-[11px] text-ink-300 hover:bg-ink-700">
          No volver a mostrar ayudas
        </button>
        <button onClick={() => dismissTip(id)} className="min-h-11 rounded-lg bg-accent px-3 text-[11px] font-medium text-white hover:bg-accent-hover">
          Entendido
        </button>
      </div>
    </div>
  )
}
