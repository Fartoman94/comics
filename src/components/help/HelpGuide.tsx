import { LifeBuoy, Lightbulb, PlayCircle } from 'lucide-react'
import { create } from 'zustand'
import { useUi } from '../../store/ui'
import { Button, cx, Modal } from '../ui/controls'
import { GUIDE } from './guideContent'

interface HelpState {
  open: boolean
  topic: string
  tourRequest: number
  openGuide(topic?: string): void
  close(): void
  startTour(): void
}

/** Estado global de la ayuda: se puede abrir desde el inicio, el editor o el tour. */
export const useHelp = create<HelpState>((set, get) => ({
  open: false,
  topic: GUIDE[0].id,
  tourRequest: 0,
  openGuide: (topic) => set({ open: true, topic: topic ?? get().topic }),
  close: () => set({ open: false }),
  startTour: () => set({ open: false, tourRequest: get().tourRequest + 1 }),
}))

export function HelpGuide({ canTour = false }: { canTour?: boolean }) {
  const { open, topic, close, startTour } = useHelp()
  const mode = useUi((s) => s.mode)
  const current = GUIDE.find((t) => t.id === topic) ?? GUIDE[0]
  const setTopic = (id: string) => useHelp.setState({ topic: id })

  return (
    <Modal open={open} onClose={close} title="Guía de uso" width="max-w-3xl">
      <div className="flex flex-col sm:flex-row">
        <nav className="scroll-thin flex shrink-0 gap-1 overflow-x-auto border-b border-ink-700 p-2 sm:w-52 sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0" aria-label="Temas">
          {GUIDE.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setTopic(t.id)}
              className={cx('flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs whitespace-nowrap transition-colors', t.id === current.id ? 'bg-accent-soft text-white' : 'text-ink-300 hover:bg-ink-800 hover:text-white')}
            >
              <span className={cx('flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold', t.id === current.id ? 'bg-accent text-white' : 'bg-ink-700 text-ink-300')}>{i + 1}</span>
              {t.title}
            </button>
          ))}
          {canTour && mode === 'studio' && (
            <button onClick={startTour} className="mt-1 flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-xs whitespace-nowrap text-accent-bright hover:bg-accent-soft sm:mt-auto">
              <PlayCircle size={15} /> Ver el tour guiado
            </button>
          )}
          <button
            onClick={() => {
              useUi.getState().resetTips()
              close()
            }}
            className={cx('flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-xs whitespace-nowrap text-ink-300 hover:bg-ink-800 hover:text-white', !(canTour && mode === 'studio') && 'sm:mt-auto')}
          >
            <Lightbulb size={15} /> Volver a mostrar las ayudas
          </button>
          <button
            onClick={() => {
              close()
              useUi.getState().requestSheet('recuperacion')
              if (!/^#\/?$/.test(location.hash)) location.hash = '/'
            }}
            className="flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-xs whitespace-nowrap text-ink-300 hover:bg-ink-800 hover:text-white"
          >
            <LifeBuoy size={15} /> Centro de recuperación
          </button>
        </nav>

        <article className="min-w-0 flex-1 p-5">
          <h3 className="font-comic text-3xl tracking-wide text-white">{current.title}</h3>
          <p className="mt-1 text-sm text-ink-400">{current.summary}</p>
          <ol className="mt-5 space-y-4">
            {current.steps.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-xs font-semibold text-accent-bright ring-1 ring-ink-700">{i + 1}</span>
                <div>
                  <div className="text-sm font-medium text-white">{s.title}</div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink-300">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          {current.tips?.map((tip) => (
            <div key={tip} className="mt-5 flex gap-2.5 rounded-xl bg-amber-400/10 p-3 text-[13px] leading-relaxed text-amber-100 ring-1 ring-amber-400/20">
              <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-300" />
              {tip}
            </div>
          ))}
          <div className="mt-6 flex justify-between gap-2 border-t border-ink-700 pt-4">
            <Button size="sm" variant="ghost" disabled={GUIDE[0].id === current.id} onClick={() => setTopic(GUIDE[GUIDE.findIndex((t) => t.id === current.id) - 1].id)}>
              ← Anterior
            </Button>
            {GUIDE[GUIDE.length - 1].id === current.id ? (
              <Button size="sm" variant="primary" onClick={close}>
                ¡A crear!
              </Button>
            ) : (
              <Button size="sm" variant="primary" onClick={() => setTopic(GUIDE[GUIDE.findIndex((t) => t.id === current.id) + 1].id)}>
                Siguiente →
              </Button>
            )}
          </div>
        </article>
      </div>
    </Modal>
  )
}
