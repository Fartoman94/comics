import { useEffect, useState } from 'react'
import { PenLine } from 'lucide-react'
import { useEditor } from '../../store/editor'
import { navigateToProject } from '../../lib/nav'
import { duplicateProject } from '../../lib/storage'
import { loadWork, SAMPLES, type SampleId } from '../../samples'
import { Reader } from '../editor/Reader'
import { Wordmark } from '../ui/Brand'

/**
 * Lectura directa de una muestra (#/muestra/<id>): se arma en memoria con el mismo motor del
 * editor y se abre en el visor de libro. No se guarda nada salvo que se pida "Editar copia".
 * Las ilustraciones ya dibujadas quedan en caché: la segunda vez abre mucho más rápido.
 */
export function SampleViewer({ id }: { id: SampleId }) {
  const project = useEditor((s) => s.project)
  const [progress, setProgress] = useState<[number, number]>([0, 1])
  const [error, setError] = useState<string | null>(null)
  const meta = SAMPLES.find((s) => s.id === id)
  const projectId = `muestra_${id}`

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const [work, { buildWorkProject }] = await Promise.all([loadWork(id), import('../../samples/build')])
        const p = await buildWorkProject(work, (pr) => alive && setProgress([pr.done, pr.total]))
        if (alive) useEditor.getState().openProject({ ...p, id: projectId })
      } catch (e) {
        console.error(e)
        if (alive) setError('No se pudo preparar la muestra en este navegador.')
      }
    })()
    return () => {
      alive = false
      useEditor.getState().closeProject()
    }
  }, [id, projectId])

  const openInEditor = async () => {
    const p = useEditor.getState().project
    if (!p) return
    try {
      const copy = await duplicateProject(p, { title: p.title })
      navigateToProject(copy.id)
    } catch (e) {
      console.error(e)
      useEditor.getState().toast('No se pudo crear la copia. ¿El navegador se quedó sin espacio?', 'error')
    }
  }

  if (!meta || error)
    return (
      <div className="grid h-full place-items-center p-6 text-center text-sm text-ink-300">
        <div>
          <p>{error ?? 'Esa muestra no existe.'}</p>
          <a href="#/" className="mt-3 inline-block text-accent-bright">
            Volver al inicio
          </a>
        </div>
      </div>
    )

  if (!project || project.id !== projectId)
    return (
      <div className="reader-room flex h-full flex-col items-center justify-center gap-5 p-6 text-center" role="status" aria-live="polite">
        <Wordmark />
        <div className="font-comic text-3xl tracking-wide text-white">Preparando {meta.title}…</div>
        <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-accent transition-all" style={{ width: `${(progress[0] / progress[1]) * 100}%` }} />
        </div>
        <p className="max-w-sm text-xs text-ink-400">{meta.genre}. Las ilustraciones, globos y onomatopeyas se arman en tu navegador con las mismas herramientas del editor.</p>
      </div>
    )

  return (
    <Reader
      onClose={() => navigateToProject(null)}
      actions={
        <button onClick={() => void openInEditor()} className="flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-white hover:bg-accent-hover">
          <PenLine size={14} /> <span className="hidden sm:inline">Editar copia</span>
        </button>
      }
    />
  )
}
