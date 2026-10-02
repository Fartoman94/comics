import { useEffect, useState } from 'react'
import { Home } from './components/home/Home'
import { Suspense } from 'react'
import { lazyWithReload } from './lib/lazyWithReload'
import { Toasts } from './components/ui/Toasts'
import { ConfirmHost } from './components/ui/Confirm'
import { loadProject } from './lib/storage'
import { ProjectFileError } from './lib/projectSchema'
import { navigateToProject } from './lib/nav'
import { useEditor } from './store/editor'
import { CrashScreen } from './components/ui/ErrorBoundary'

// El editor (Konva, exportadores) y la demo se cargan sólo cuando se abren.
const Editor = lazyWithReload(() => import('./components/editor/Editor').then((m) => ({ default: m.Editor })))
const DemoViewer = lazyWithReload(() => import('./components/demo/DemoViewer').then((m) => ({ default: m.DemoViewer })))
const Loading = () => <div className="grid h-full place-items-center text-sm text-ink-400" role="status">Cargando…</div>

const isDemoHash = () => /^#\/demo\b/.test(location.hash)

function projectIdFromHash() {
  const m = location.hash.match(/^#\/p\/([\w-]+)/)
  return m ? m[1] : null
}

export function App() {
  const [routeId, setRouteId] = useState(projectIdFromHash)
  const [demo, setDemo] = useState(isDemoHash)
  const project = useEditor((s) => s.project)
  const [missing, setMissing] = useState(false)
  // Proyecto que existe pero no se puede abrir (dañado o error de lectura).
  const [broken, setBroken] = useState<{ id: string; message: string } | null>(null)

  useEffect(() => {
    const onHash = () => {
      setRouteId(projectIdFromHash())
      setDemo(isDemoHash())
    }
    window.addEventListener('hashchange', onHash)
    // Pedimos almacenamiento persistente para que el navegador no borre los proyectos.
    void navigator.storage?.persist?.()
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    let cancelled = false
    const s = useEditor.getState()
    if (demo) return
    if (!routeId) {
      if (s.project) s.closeProject()
      return
    }
    if (s.project?.id === routeId) return
    setMissing(false)
    setBroken(null)
    loadProject(routeId)
      .then((p) => {
        if (cancelled) return
        if (p) useEditor.getState().openProject(p)
        else setMissing(true)
      })
      .catch((e) => {
        if (cancelled) return
        console.error(e)
        setBroken({ id: routeId, message: e instanceof ProjectFileError ? e.message : 'No se pudo leer el proyecto guardado en este navegador.' })
      })
    return () => {
      cancelled = true
    }
  }, [routeId, demo])

  useEffect(() => {
    document.title = project ? `${project.title} · Viñeta Studio` : 'Viñeta Studio'
  }, [project?.title, project])

  return (
    <>
      <Suspense fallback={<Loading />}>
      {demo ? (
        <DemoViewer />
      ) : routeId && broken?.id === routeId ? (
        <CrashScreen projectId={broken.id} message={broken.message} onHome={() => navigateToProject(null)} />
      ) : routeId && project?.id === routeId ? (
        <Editor />
      ) : routeId && !missing ? (
        <div className="grid h-full place-items-center text-sm text-ink-400">Abriendo proyecto…</div>
      ) : (
        <Home notFound={missing} />
      )}
      </Suspense>
      <Toasts />
      <ConfirmHost />
    </>
  )
}
