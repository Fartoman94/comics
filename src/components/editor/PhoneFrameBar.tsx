import { ChevronDown, ChevronUp, Smartphone, X } from 'lucide-react'
import { useEditor } from '../../store/editor'
import { PHONES, useUi, type PhoneId } from '../../store/ui'

/** Controles del marco de teléfono (webtoon): dispositivo, pasar de a una pantalla y previsualizar. */
export function PhoneFrameBar({ onPreview }: { onPreview: () => void }) {
  const frame = useUi((s) => s.phoneFrame)
  const project = useEditor((s) => s.project)
  const vertical = project?.kind === 'webtoon' || project?.readingDirection === 'vertical'
  if (!vertical || !project) return null
  const set = useUi.getState().setPhoneFrame
  if (!frame.on)
    return (
      <button onClick={() => set({ on: true, y: 0 })} className="absolute top-3 right-3 z-10 flex h-9 items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-800/95 px-3 text-xs text-ink-100 shadow-lg backdrop-blur hover:bg-ink-700 pointer-coarse:h-11">
        <Smartphone size={15} /> Vista de pantalla del teléfono
      </button>
    )
  const dev = PHONES.find((d) => d.id === frame.device) ?? PHONES[1]
  const { width: PW, height: PH } = project.format
  const fh = Math.min(PH, (PW * dev.h) / dev.w)
  const stepBy = (dir: 1 | -1) => {
    const s = useEditor.getState()
    const pages = s.project!.pages
    const i = pages.findIndex((p) => p.id === s.pageId)
    const bottom = Math.max(0, PH - fh)
    // Desde el final de la página, la próxima pantalla es el principio de la página siguiente (y al revés).
    if (dir === 1 && frame.y >= bottom - 1 && i < pages.length - 1) return (s.setPage(pages[i + 1].id), set({ y: 0 }))
    if (dir === -1 && frame.y <= 1 && i > 0) return (s.setPage(pages[i - 1].id), set({ y: bottom }))
    set({ y: Math.max(0, Math.min(bottom, frame.y + dir * fh)) })
  }
  return (
    <div className="absolute top-3 right-3 z-10 flex flex-wrap items-center gap-1 rounded-xl border border-ink-600 bg-ink-800/95 p-1 text-xs text-ink-100 shadow-lg backdrop-blur" role="toolbar" aria-label="Vista de pantalla del teléfono">
      <select value={frame.device} onChange={(e) => set({ device: e.target.value as PhoneId })} aria-label="Tamaño de teléfono" className="h-8 rounded-md border border-ink-600 bg-ink-900 px-1 text-xs text-white pointer-coarse:h-11">
        {PHONES.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      <button onClick={() => stepBy(-1)} aria-label="Pantalla anterior" className="flex size-8 items-center justify-center rounded-md hover:bg-ink-700 pointer-coarse:size-11">
        <ChevronUp size={16} />
      </button>
      <button onClick={() => stepBy(1)} aria-label="Pantalla siguiente" className="flex size-8 items-center justify-center rounded-md hover:bg-ink-700 pointer-coarse:size-11">
        <ChevronDown size={16} />
      </button>
      <button onClick={onPreview} className="h-8 rounded-md bg-accent px-2.5 font-medium text-white hover:bg-accent-hover pointer-coarse:h-11">
        Previsualizar scroll
      </button>
      <button onClick={() => set({ on: false })} aria-label="Ocultar marco del teléfono" className="flex size-8 items-center justify-center rounded-md hover:bg-ink-700 pointer-coarse:size-11">
        <X size={15} />
      </button>
    </div>
  )
}
