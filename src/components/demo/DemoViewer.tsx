import { useEffect, useState } from 'react'
import { PenLine } from 'lucide-react'
import { useEditor } from '../../store/editor'
import { buildDemoProject } from '../../demo/demoProject'
import { duplicateProject } from '../../lib/storage'
import { navigateToProject } from '../../lib/nav'
import { Reader } from '../editor/Reader'
import { Wordmark } from '../ui/Brand'

/** Manga de ejemplo: se arma con el mismo motor del editor y se abre en el visor. */
export function DemoViewer() {
  const project = useEditor((s) => s.project)
  const [progress, setProgress] = useState<[number, number]>([0, 1])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    buildDemoProject((d, t) => alive && setProgress([d, t]))
      .then((p) => alive && useEditor.getState().openProject(p))
      .catch((e) => {
        console.error(e)
        if (alive) setError('No se pudo preparar el manga de ejemplo en este navegador.')
      })
    return () => {
      alive = false
      useEditor.getState().closeProject()
    }
  }, [])

  const openInEditor = async () => {
    const p = useEditor.getState().project
    if (!p) return
    // Copia propia (con sus propias imágenes) para editarla sin romper la demo.
    try {
      const copy = await duplicateProject(p, { title: 'Viento de sakura (mi copia)' })
      navigateToProject(copy.id)
    } catch (e) {
      console.error(e)
      useEditor.getState().toast('No se pudo crear la copia. ¿El navegador se quedó sin espacio?', 'error')
    }
  }

  if (error)
    return (
      <div className="grid h-full place-items-center p-6 text-center text-sm text-ink-300">
        <div>
          <p>{error}</p>
          <a href="#/" className="mt-3 inline-block text-accent">
            Volver al inicio
          </a>
        </div>
      </div>
    )

  if (!project || project.id !== 'demo')
    return (
      <div className="reader-room flex h-full flex-col items-center justify-center gap-5 p-6 text-center">
        <Wordmark />
        <div className="font-comic text-3xl tracking-wide text-white">Preparando el manga de ejemplo…</div>
        <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-accent transition-all" style={{ width: `${(progress[0] / progress[1]) * 100}%` }} />
        </div>
        <p className="max-w-sm text-xs text-ink-400">Dibujos, globos y onomatopeyas se generan en tu navegador con las mismas herramientas del editor.</p>
      </div>
    )

  return (
    <Reader
      onClose={() => navigateToProject(null)}
      actions={
        <button onClick={() => void openInEditor()} className="flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-white hover:bg-accent-hover">
          <PenLine size={14} /> <span className="hidden sm:inline">Abrir en el editor</span>
        </button>
      }
    />
  )
}
