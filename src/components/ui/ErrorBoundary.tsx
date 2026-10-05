import { Component, useState, type ReactNode } from 'react'
import { AlertTriangle, Download, Home, RotateCcw, Trash2 } from 'lucide-react'
import { deleteDamagedProject, downloadBlob, exportRawProjectFile, safeFilename } from '../../lib/storage'
import { useEditor } from '../../store/editor'

const projectIdFromHash = () => location.hash.match(/^#\/p\/([\w-]+)/)?.[1] ?? null

/**
 * Red de seguridad global: si algo se rompe al dibujar, en vez de una pantalla en blanco
 * se ofrece volver al inicio y, si el problema es un proyecto, descargarlo o borrarlo.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null; resetKey: number }> {
  state = { error: null as Error | null, resetKey: 0 }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[Viñeta Studio] error de interfaz', error)
  }

  reset = () => {
    useEditor.getState().closeProject()
    this.setState((s) => ({ error: null, resetKey: s.resetKey + 1 }))
  }

  render() {
    if (!this.state.error) return <div key={this.state.resetKey} className="contents">{this.props.children}</div>
    return <CrashScreen onHome={() => ((location.hash = '/'), this.reset())} />
  }
}

/** Pantalla de recuperación. También se usa cuando un proyecto guardado no pasa la validación. */
export function CrashScreen({ onHome, projectId = projectIdFromHash(), message }: { onHome: () => void; projectId?: string | null; message?: string }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const download = async () => {
    if (!projectId) return
    setBusy(true)
    try {
      downloadBlob(await exportRawProjectFile(projectId), `${safeFilename('proyecto-dañado')}-${projectId}.vineta`)
      setNote('Se descargó una copia del proyecto tal como estaba guardado.')
    } catch {
      setNote('No se pudo descargar la copia.')
    } finally {
      setBusy(false)
    }
  }
  const remove = async () => {
    if (!projectId) return
    setBusy(true)
    try {
      await deleteDamagedProject(projectId)
      onHome()
    } catch {
      setNote('No se pudo borrar el proyecto.')
      setBusy(false)
    }
  }
  return (
    <main className="grid h-full place-items-center bg-ink-950 p-6 text-center text-ink-100">
      <div className="max-w-md">
        <AlertTriangle className="mx-auto text-amber-400" size={36} />
        <h1 className="mt-3 text-xl font-semibold text-fg">{projectId ? 'No se pudo abrir este proyecto' : 'Algo salió mal'}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-300">
          {message ?? (projectId ? 'El proyecto tiene datos dañados. Tus otros proyectos no se tocaron.' : 'Ocurrió un error inesperado. Tus proyectos siguen guardados en este navegador.')}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={onHome} className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover">
            <Home size={16} /> Volver al inicio
          </button>
          <button onClick={() => location.reload()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink-700 px-4 text-sm font-medium text-ink-100 hover:bg-ink-600">
            <RotateCcw size={16} /> Recargar
          </button>
        </div>
        {projectId && (
          <div className="mt-6 rounded-xl border border-ink-700 p-4 text-left">
            <p className="text-xs text-ink-300">Opciones para el proyecto dañado:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button disabled={busy} onClick={() => void download()} className="inline-flex h-9 items-center gap-2 rounded-lg bg-ink-700 px-3 text-xs text-ink-100 hover:bg-ink-600 disabled:opacity-50">
                <Download size={14} /> Descargar copia
              </button>
              {confirming ? (
                <button disabled={busy} onClick={() => void remove()} className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50">
                  <Trash2 size={14} /> Sí, eliminar este proyecto
                </button>
              ) : (
                <button disabled={busy} onClick={() => setConfirming(true)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-ink-700 px-3 text-xs text-red-300 hover:bg-ink-600 disabled:opacity-50">
                  <Trash2 size={14} /> Eliminar proyecto
                </button>
              )}
            </div>
            {note && <p className="mt-3 text-xs text-ink-400">{note}</p>}
          </div>
        )}
      </div>
    </main>
  )
}
