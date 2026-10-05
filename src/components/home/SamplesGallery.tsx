import { useEffect, useState } from 'react'
import { BookOpen, Loader2, PenLine } from 'lucide-react'
import { coverSvg, createSampleProject, SAMPLES, type SampleId } from '../../samples'
import { navigateToProject } from '../../lib/nav'
import { useEditor } from '../../store/editor'
import { Modal } from '../ui/controls'

/**
 * Vitrina: seis obras de muestra hechas con el editor (cómic, shonen, seinen, shojo, webtoon y
 * novela gráfica estilo anime). Abrir una crea una copia editable en "Tus proyectos".
 */
export function SamplesGallery() {
  const [busy, setBusy] = useState<{ id: SampleId; done: number; total: number } | null>(null)
  const open = async (id: SampleId) => {
    if (busy) return
    setBusy({ id, done: 0, total: 1 })
    try {
      const pid = await createSampleProject(id, (done, total) => setBusy({ id, done, total }))
      navigateToProject(pid)
    } catch (e) {
      console.error(e)
      useEditor.getState().toast('No se pudo preparar la muestra. ¿El navegador se quedó sin espacio?', 'error')
    } finally {
      setBusy(null)
    }
  }
  const current = busy ? SAMPLES.find((s) => s.id === busy.id) : null
  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6" aria-labelledby="muestras-titulo" data-testid="muestras">
      <div className="mb-5">
        <h2 id="muestras-titulo" className="text-lg font-semibold">
          Muestras hechas con Viñeta Studio
        </h2>
        <p className="text-sm text-ink-400">Seis obras originales de más de 30 páginas, cada una con su estilo. Leelas directo como libro, o abrí una copia editable para ver cómo están armadas.</p>
      </div>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {SAMPLES.map((s) => (
          <li key={s.id} className="flex flex-col overflow-hidden rounded-xl border border-ink-800 bg-ink-900 transition-colors hover:border-accent">
            <a href={`#/muestra/${s.id}`} aria-label={`Leer ${s.title}: ${s.genre}`} className="group block">
              <Cover id={s.id} title={s.title} accent={s.accent} />
            </a>
            <span className="flex flex-1 flex-col p-2.5">
              <span className="block text-[10px] font-semibold tracking-wide text-accent-bright uppercase">{s.genre.split('·')[0]}</span>
              <span className="block flex-1 text-xs leading-snug text-ink-300">{s.subtitle}</span>
              <span className="mt-2 flex gap-1.5">
                <a href={`#/muestra/${s.id}`} className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-accent px-2 py-1.5 text-[11px] font-medium text-white hover:bg-accent-hover">
                  <BookOpen size={12} /> Leer
                </a>
                <button onClick={() => void open(s.id)} disabled={!!busy} aria-label={`Editar una copia de ${s.title}`} title="Crea una copia editable en Tus proyectos" className="inline-flex items-center justify-center gap-1 rounded-md bg-ink-700 px-2 py-1.5 text-[11px] text-ink-100 hover:bg-ink-600 disabled:opacity-50">
                  <PenLine size={12} /> Editar
                </button>
              </span>
            </span>
          </li>
        ))}
      </ul>
      <Modal open={!!busy} onClose={() => undefined} title="Preparando la muestra" width="max-w-sm">
        <div className="space-y-3 p-5" role="status" aria-live="polite">
          <p className="flex items-center gap-2 text-sm text-ink-200">
            <Loader2 size={16} className="animate-spin text-accent-bright" /> {current?.title}: dibujando ilustraciones…
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-ink-700">
            <div className="h-full bg-accent transition-[width]" style={{ width: `${busy ? Math.round((busy.done / busy.total) * 100) : 0}%` }} />
          </div>
          <p className="text-xs text-ink-400 tabular-nums">
            {busy?.done ?? 0} de {busy?.total ?? 0} · se guarda como un proyecto tuyo, editable
          </p>
        </div>
      </Modal>
    </section>
  )
}

function Cover({ id, title, accent }: { id: SampleId; title: string; accent: string }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    void coverSvg(id).then((svg) => alive && setSrc('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)))
    return () => {
      alive = false
    }
  }, [id])
  return (
    <span className="relative block aspect-[2/3] overflow-hidden bg-ink-800">
      {src && <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
      <span className="font-comic absolute inset-x-1.5 top-2 text-center text-lg leading-none tracking-wide [text-shadow:0_2px_0_#000,2px_0_0_#000,-2px_0_0_#000,0_-2px_0_#000]" style={{ color: accent }}>
        {title}
      </span>
    </span>
  )
}
