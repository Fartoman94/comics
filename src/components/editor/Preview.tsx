import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Columns2, FileText, Maximize2, Minimize2, ScrollText, Smartphone } from 'lucide-react'
import { useEditor } from '../../store/editor'
import { PHONES, useUi, type PhoneId } from '../../store/ui'
import { keyStep, pageLabel, spreadOf } from '../../lib/readerNav'
import { useFocusTrap } from '../ui/useFocusTrap'
import { cx } from '../ui/controls'
import { usePageImages, useReadingOverlay } from './Reader'

type View = 'page' | 'spread' | 'scroll' | 'phone'
type Zoom = 'fit' | 'actual' | 'width'

const VIEWS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: 'page', label: 'Página', icon: <FileText size={14} /> },
  { id: 'spread', label: 'Pliego', icon: <Columns2 size={14} /> },
  { id: 'scroll', label: 'Scroll', icon: <ScrollText size={14} /> },
  { id: 'phone', label: 'Teléfono', icon: <Smartphone size={14} /> },
]
const ZOOMS: { id: Zoom; label: string }[] = [
  { id: 'fit', label: 'Ajustar' },
  { id: 'actual', label: '100 %' },
  { id: 'width', label: 'Ancho' },
]

/**
 * Previsualización: el resultado limpio, con el mismo motor de render que el lector y la exportación
 * (sin guías, selección ni UI de edición).
 */
export function Preview({ onClose }: { onClose: () => void }) {
  const [project] = useState(() => useEditor.getState().project!)
  const n = project.pages.length
  const rtl = project.readingDirection === 'rtl'
  const isStrip = project.kind === 'webtoon' || project.readingDirection === 'vertical'
  const [view, setView] = useState<View>(isStrip ? 'phone' : 'page')
  const [zoom, setZoom] = useState<Zoom>('fit')
  const [index, setIndex] = useState(() => Math.max(0, project.pages.findIndex((p) => p.id === useEditor.getState().pageId)))
  const [fullscreen, setFullscreen] = useState(false)
  // Teléfono: el mismo tamaño elegido en el marco del editor (360, 390 o 430 de ancho).
  const device = useUi((s) => s.phoneFrame.device)
  const phone = PHONES.find((p) => p.id === device) ?? PHONES[1]
  const rootRef = useRef<HTMLDivElement>(null)
  // Resolución nativa de la página (×2 en pantallas retina) para que "100 %" sea real.
  const target = useMemo(() => Math.min(3600, project.format.height * Math.min(2, window.devicePixelRatio || 1)), [project.format.height])
  const images = usePageImages(project, target)
  useReadingOverlay()
  useFocusTrap(rootRef)

  const shown = view === 'spread' ? spreadOf(index, n) : [index]
  const move = (dir: 1 | -1) => {
    if (view === 'spread') {
      const cur = spreadOf(index, n)
      setIndex(Math.max(0, Math.min(n - 1, dir === 1 ? cur[cur.length - 1] + 1 : cur[0] - 1)))
    } else setIndex((i) => Math.max(0, Math.min(n - 1, i + dir)))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) return onClose()
      if (view === 'scroll' || view === 'phone') return
      const k = keyStep(e.key, rtl)
      if (k === 1 || k === -1) {
        e.preventDefault()
        move(k)
      } else if (k === 'first') setIndex(0)
      else if (k === 'last') setIndex(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])
  const toggleFs = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void rootRef.current?.requestFullscreen?.().catch(() => undefined)
  }

  const W = project.format.width
  const H = project.format.height
  // Tamaño en px CSS de cada página según el zoom (los "100 %" son px de la página).
  const pageStyle = (count: number): React.CSSProperties =>
    zoom === 'actual'
      ? { width: W, height: H, maxWidth: 'none' }
      : zoom === 'width'
        ? { width: `calc((100vw - 32px) / ${count})`, height: 'auto' }
        : { maxWidth: `calc((100vw - 32px) / ${count})`, maxHeight: 'calc(100dvh - 140px)', width: 'auto', height: 'auto' }

  const ready = images.length > 0
  return (
    <div ref={rootRef} className="reader-room fixed inset-0 z-50 flex flex-col text-white" role="dialog" aria-modal="true" aria-label={`Previsualización: ${project.title}`}>
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 bg-black/40 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button onClick={onClose} className="flex h-9 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-sm hover:bg-white/20" aria-label="Volver al editor">
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="min-w-0 flex-1 truncate text-sm font-semibold">{project.title}</div>
        <div className="flex rounded-lg bg-white/10 p-0.5" role="group" aria-label="Vista">
          {VIEWS.filter((v) => v.id !== 'phone' || isStrip).map((v) => (
            <button key={v.id} onClick={() => setView(v.id)} aria-pressed={view === v.id} title={v.label} className={cx('flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs', view === v.id ? 'bg-white/20' : 'text-white/60')}>
              {v.icon} <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
        {view === 'phone' && (
          <select value={device} onChange={(e) => useUi.getState().setPhoneFrame({ device: e.target.value as PhoneId })} aria-label="Tamaño de teléfono" className="h-8 rounded-lg bg-white/10 px-2 text-xs text-white">
            {PHONES.map((p) => (
              <option key={p.id} value={p.id} className="text-black">
                {p.label}
              </option>
            ))}
          </select>
        )}
        {view !== 'phone' && (
          <div className="flex rounded-lg bg-white/10 p-0.5" role="group" aria-label="Zoom">
            {ZOOMS.map((z) => (
              <button key={z.id} onClick={() => setZoom(z.id)} aria-pressed={zoom === z.id} className={cx('h-8 rounded-md px-2.5 text-xs', zoom === z.id ? 'bg-white/20' : 'text-white/60')}>
                {z.label}
              </button>
            ))}
          </div>
        )}
        <button onClick={toggleFs} title="Pantalla completa" aria-label="Pantalla completa" className="hidden size-9 items-center justify-center rounded-lg hover:bg-white/10 sm:flex">
          {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>
      </header>

      {!ready ? (
        <div className="grid flex-1 place-items-center text-sm text-white/60" role="status">
          Preparando la previsualización…
        </div>
      ) : view === 'scroll' || view === 'phone' ? (
        <div className="scroll-thin flex-1 overflow-auto" data-testid="previsualizacion">
          <div
            className={cx('mx-auto', view === 'phone' ? 'scroll-thin my-4 max-w-full overflow-y-auto rounded-[28px] border-8 border-black shadow-2xl' : zoom === 'actual' ? 'w-max py-4' : 'max-w-[900px] px-4 py-4')}
            style={view === 'phone' ? { width: phone.w + 16, height: `min(${phone.h + 16}px, calc(100dvh - 120px))` } : undefined}
            data-testid={view === 'phone' ? 'pantalla-telefono' : undefined}
          >
            {project.pages.map((p, i) =>
              images[i] ? (
                <img key={p.id} src={images[i]} alt={p.name || `Página ${i + 1}`} className="block w-full" style={view !== 'phone' && zoom === 'actual' ? { width: W } : undefined} />
              ) : (
                <div key={p.id} className="w-full bg-white/5" style={{ aspectRatio: `${W} / ${H}` }} />
              ),
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="scroll-thin flex flex-1 items-start justify-center overflow-auto p-4" data-testid="previsualizacion">
            <div className={cx('m-auto flex gap-0 shadow-2xl', rtl && 'flex-row-reverse')}>
              {shown.map((i) =>
                images[i] ? <img key={i} src={images[i]} alt={project.pages[i]?.name || `Página ${i + 1}`} className="block bg-white" style={pageStyle(shown.length)} /> : <div key={i} className="bg-white/5" style={{ aspectRatio: `${W} / ${H}`, ...pageStyle(shown.length) }} />,
              )}
            </div>
          </div>
          <footer className="flex shrink-0 items-center justify-center gap-3 border-t border-white/10 bg-black/40 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <button onClick={() => move(rtl ? 1 : -1)} className="flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label={rtl ? 'Página siguiente' : 'Página anterior'}>
              <ChevronLeft size={20} />
            </button>
            <span className="min-w-28 text-center text-xs tabular-nums" aria-live="polite">
              {pageLabel(shown, n)}
            </span>
            <button onClick={() => move(rtl ? -1 : 1)} className="flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label={rtl ? 'Página anterior' : 'Página siguiente'}>
              <ChevronRight size={20} />
            </button>
          </footer>
        </>
      )}
    </div>
  )
}
