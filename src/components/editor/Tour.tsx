import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '../ui/controls'
import { useHelp } from '../help/HelpGuide'

interface Step {
  /** Valor de data-tour del elemento a resaltar. Sin target = tarjeta centrada. */
  target?: string
  title: string
  body: string
}

const STEPS: Step[] = [
  { title: '¡Bienvenido a Viñeta Studio!', body: 'Te mostramos en un minuto dónde está cada cosa. Podés saltearlo y volver cuando quieras desde el botón de Ayuda.' },
  { target: 'tools', title: 'Herramientas', body: 'Seleccionar, mano, dibujar viñetas, globos, texto, pincel y borrador. Cada una tiene su tecla: V, H, P, G, T, B y E.' },
  { target: 'tab-pages', title: 'Páginas', body: 'Todas las páginas de tu obra. Agregá, duplicá y arrastrá para reordenar.' },
  { target: 'tab-layouts', title: 'Viñetas', body: 'Plantillas listas: clásicas, cortes diagonales de manga, yonkoma y tiras. Un toque y se arma la página.' },
  { target: 'tab-assets', title: 'Imágenes y fotos', body: 'Subí tus dibujos o fotos. Arrastralos a una viñeta y la rellenan; doble clic para encuadrar.' },
  { target: 'canvas', title: 'Tu página', body: 'Acá armás todo. Rueda del mouse o dos dedos para moverte, Ctrl + rueda o pellizco para el zoom. Doble clic sobre un globo para escribir.' },
  { target: 'tab-insert', title: 'Insertar', body: 'Globos de diálogo, onomatopeyas en español, japonés, coreano y chino, efectos manga y capas de dibujo.' },
  { target: 'inspector', title: 'Propiedades', body: 'Todo lo que seleccionás se ajusta acá: colores, fuentes, filtros, modos de fusión y posición.' },
  { target: 'read', title: 'Leer', body: 'Mirá tu obra como un libro de verdad: las páginas se dan vuelta arrastrando la esquina.' },
  { target: 'export', title: 'Exportar', body: 'PDF para imprimir, imágenes, ZIP o un libro web para compartir. Tu trabajo se guarda solo en este navegador.' },
  { target: 'help', title: '¿Dudas?', body: 'En Ayuda tenés la guía paso a paso de cada función y podés volver a ver este tour.' },
]

const STORAGE_KEY = 'vineta:tour-done'
const GAP = 12
const MARGIN = 12

function findTarget(id?: string): HTMLElement | null {
  if (!id) return null
  // El mismo destino puede existir en escritorio y en la barra móvil: usamos el visible.
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`))
  return all.find((el) => el.getClientRects().length > 0 && el.offsetWidth > 0) ?? null
}

interface Layout {
  hole: DOMRect | null
  card: { left: number; top: number; width: number }
}

/** Ubica la tarjeta junto al elemento sin salirse nunca de la pantalla. */
function computeLayout(target: HTMLElement | null, cardH: number): Layout {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const width = Math.min(340, vw - MARGIN * 2)
  if (!target) return { hole: null, card: { width, left: (vw - width) / 2, top: Math.max(MARGIN, (vh - cardH) / 2) } }
  const r = target.getBoundingClientRect()
  const pad = 6
  const hole = new DOMRect(Math.max(4, r.left - pad), Math.max(4, r.top - pad), Math.min(vw - 8, r.width + pad * 2), Math.min(vh - 8, r.height + pad * 2))
  const clampX = (x: number) => Math.max(MARGIN, Math.min(vw - width - MARGIN, x))
  const clampY = (y: number) => Math.max(MARGIN, Math.min(vh - cardH - MARGIN, y))
  const candidates = [
    { fits: hole.right + GAP + width <= vw - MARGIN, left: hole.right + GAP, top: clampY(hole.top) },
    { fits: hole.left - GAP - width >= MARGIN, left: hole.left - GAP - width, top: clampY(hole.top) },
    { fits: hole.bottom + GAP + cardH <= vh - MARGIN, left: clampX(hole.left + hole.width / 2 - width / 2), top: hole.bottom + GAP },
    { fits: hole.top - GAP - cardH >= MARGIN, left: clampX(hole.left + hole.width / 2 - width / 2), top: hole.top - GAP - cardH },
  ]
  // Elementos enormes (el lienzo): la tarjeta va encima, centrada abajo.
  const big = hole.width > vw * 0.5 && hole.height > vh * 0.5
  const pick = big ? { left: clampX(hole.left + hole.width / 2 - width / 2), top: clampY(hole.bottom - cardH - 24) } : (candidates.find((c) => c.fits) ?? { left: clampX((vw - width) / 2), top: clampY(vh - cardH - MARGIN) })
  return { hole, card: { width, left: pick.left, top: pick.top } }
}

export function Tour() {
  const [step, setStep] = useState<number | null>(null)
  const [layout, setLayout] = useState<Layout | null>(null)
  const [cardEl, setCardEl] = useState<HTMLDivElement | null>(null)
  const tourRequest = useHelp((s) => s.tourRequest)

  useEffect(() => {
    let done = false
    try {
      done = localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      /* sin almacenamiento: mostramos el tour igual */
    }
    if (!done) {
      const t = setTimeout(() => setStep(0), 700)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    if (tourRequest > 0) setStep(0)
  }, [tourRequest])

  const finish = useCallback(() => {
    setStep(null)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignorar */
    }
  }, [])

  const measure = useCallback(() => {
    if (step === null) return
    setLayout(computeLayout(findTarget(STEPS[step].target), cardEl?.offsetHeight ?? 190))
  }, [step, cardEl])

  useLayoutEffect(() => {
    measure()
  }, [measure])

  useEffect(() => {
    if (step === null) return
    window.addEventListener('resize', measure)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
      if (e.key === 'ArrowRight' || e.key === 'Enter') setStep((s) => (s === null ? s : s < STEPS.length - 1 ? s + 1 : (finish(), null)))
      if (e.key === 'ArrowLeft') setStep((s) => (s ? s - 1 : s))
      e.stopPropagation()
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [step, measure, finish])

  if (step === null || !layout) return null
  const s = STEPS[step]
  const last = step === STEPS.length - 1
  const { hole, card } = layout

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={s.title}>
      {hole ? (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-accent transition-all duration-300"
          style={{ left: hole.left, top: hole.top, width: hole.width, height: hole.height, boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.62)' }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/62" />
      )}
      <div
        ref={setCardEl}
        className="absolute rounded-2xl border border-ink-600 bg-ink-850 p-4 shadow-2xl transition-all duration-300"
        style={{ left: card.left, top: card.top, width: card.width }}
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">{s.title}</h3>
          <button onClick={finish} className="-mt-1 -mr-1 flex size-7 shrink-0 items-center justify-center rounded-md text-ink-400 hover:bg-ink-700 hover:text-white" aria-label="Cerrar tour">
            <X size={15} />
          </button>
        </div>
        <p className="text-[13px] leading-relaxed text-ink-300">{s.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex gap-1" aria-label={`Paso ${step + 1} de ${STEPS.length}`}>
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-4 bg-accent' : 'w-1.5 bg-ink-600'}`} />
            ))}
          </div>
          <div className="flex shrink-0 gap-1.5">
            {step === 0 ? (
              <Button size="sm" variant="ghost" onClick={finish}>
                Saltear
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setStep(step - 1)}>
                Atrás
              </Button>
            )}
            <Button size="sm" variant="primary" onClick={() => (last ? finish() : setStep(step + 1))}>
              {step === 0 ? 'Empezar' : last ? '¡Listo!' : 'Siguiente'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
