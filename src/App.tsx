import { useEffect, useState } from 'react'
import { Home } from './components/home/Home'
import { Editor } from './components/editor/Editor'
import { Toasts } from './components/ui/Toasts'
import { ConfirmHost } from './components/ui/Confirm'
import { loadProject } from './lib/storage'
import { useEditor } from './store/editor'

function projectIdFromHash() {
  const m = location.hash.match(/^#\/p\/([\w-]+)/)
  return m ? m[1] : null
}

export function App() {
  const [routeId, setRouteId] = useState(projectIdFromHash)
  const project = useEditor((s) => s.project)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    const onHash = () => setRouteId(projectIdFromHash())
    window.addEventListener('hashchange', onHash)
    // Pedimos almacenamiento persistente para que el navegador no borre los proyectos.
    void navigator.storage?.persist?.()
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    let cancelled = false
    const s = useEditor.getState()
    if (!routeId) {
      if (s.project) s.closeProject()
      return
    }
    if (s.project?.id === routeId) return
    setMissing(false)
    void loadProject(routeId).then((p) => {
      if (cancelled) return
      if (p) useEditor.getState().openProject(p)
      else setMissing(true)
    })
    return () => {
      cancelled = true
    }
  }, [routeId])

  useEffect(() => {
    document.title = project ? `${project.title} · Viñeta Studio` : 'Viñeta Studio'
  }, [project?.title, project])

  return (
    <>
      {routeId && project?.id === routeId ? (
        <Editor />
      ) : routeId && !missing ? (
        <div className="grid h-full place-items-center text-sm text-ink-400">Abriendo proyecto…</div>
      ) : (
        <Home notFound={missing} />
      )}
      <Toasts />
      <ConfirmHost />
    </>
  )
}
