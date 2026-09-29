import { useEffect, useRef, useState } from 'react'
import { BookOpen, Copy, Download, FileUp, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import type { Project } from '../../types'
import { deleteProject, importProjectFile, listProjects, saveProject } from '../../lib/storage'
import { exportProject } from '../../lib/export'
import { navigateToProject } from '../../lib/nav'
import { uid } from '../../lib/id'
import { PROJECT_KINDS } from '../../lib/formats'
import { useEditor } from '../../store/editor'
import { Button, IconButton, Menu, MenuItem } from '../ui/controls'
import { MadeByMateLabs, Wordmark } from '../ui/Brand'
import { confirmDialog } from '../ui/Confirm'
import { NewProjectDialog } from './NewProjectDialog'

const FEATURES = [
  ['Plantillas de viñetas', 'Cuadrículas clásicas, cortes diagonales de manga, yonkoma y tiras.'],
  ['Imágenes y fotos', 'Arrastrá tus archivos: rellenan la viñeta y se encuadran con zoom.'],
  ['Globos y onomatopeyas', 'Diálogo, pensamiento, grito, susurro, narración y SFX con contorno.'],
  ['Dibujo con presión', 'Pluma, tinta, lápiz y marcador con soporte para tableta y borrador.'],
  ['Tramas y efectos', 'Tramas de puntos, líneas de velocidad y de impacto estilo manga.'],
  ['Exportá en serio', 'PDF para imprenta, PNG por página, ZIP y tira larga de webtoon.'],
]

export function Home({ notFound }: { notFound?: boolean }) {
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const toast = useEditor((s) => s.toast)

  const refresh = () => void listProjects().then(setProjects)
  useEffect(refresh, [])
  useEffect(() => {
    if (notFound) toast('Ese proyecto no existe en este navegador', 'error')
  }, [notFound, toast])

  const onImport = async (f: File | undefined) => {
    if (!f) return
    try {
      const p = await importProjectFile(f)
      toast(`"${p.title}" importado`, 'success')
      refresh()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo importar el archivo', 'error')
    }
  }

  const duplicate = async (p: Project) => {
    await saveProject({ ...structuredClone(p), id: uid('pr_'), title: `${p.title} (copia)`, updatedAt: Date.now(), createdAt: Date.now() })
    refresh()
  }

  const remove = async (p: Project) => {
    if (!(await confirmDialog('Eliminar proyecto', `"${p.title}" y todas sus imágenes se borrarán de este navegador. No se puede deshacer.`, { confirmLabel: 'Eliminar', danger: true }))) return
    await deleteProject(p)
    refresh()
  }

  return (
    <div className="scroll-thin h-full overflow-y-auto">
      <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Wordmark />
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => fileRef.current?.click()} className="hidden sm:inline-flex">
              <FileUp size={16} /> Importar
            </Button>
            <Button variant="primary" onClick={() => setNewOpen(true)}>
              <Plus size={16} /> Nuevo proyecto
            </Button>
          </div>
          <input ref={fileRef} type="file" accept=".vineta,application/json" hidden onChange={(e) => void onImport(e.target.files?.[0])} />
        </div>
      </header>

      <section className="halftone border-b border-ink-800">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-accent uppercase">Estudio de historietas en el navegador</p>
          <h1 className="font-comic max-w-3xl text-5xl leading-[0.95] tracking-wide text-white sm:text-7xl">
            Dibujá, rotulá y publicá tu <span className="text-accent">cómic</span> o <span className="text-accent">manga</span>.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-300">
            Viñetas, fotos, globos, tramas y dibujo con presión en un solo lugar. Todo se guarda automáticamente en tu navegador y se exporta listo para imprimir o publicar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => setNewOpen(true)} className="h-11 px-5 text-base">
              <Plus size={18} /> Empezar un proyecto
            </Button>
            <Button onClick={() => fileRef.current?.click()} className="h-11 px-5 text-base">
              <FileUp size={18} /> Abrir archivo .vineta
            </Button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold">Tus proyectos</h2>
            <p className="text-sm text-ink-400">Guardados en este navegador.</p>
          </div>
        </div>

        {projects === null ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-ink-850" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PROJECT_KINDS.map((k) => (
              <button key={k.id} onClick={() => setNewOpen(true)} className="rounded-xl border border-dashed border-ink-600 p-5 text-left transition-colors hover:border-accent hover:bg-ink-850">
                <div className="font-comic text-2xl tracking-wide text-white">{k.name}</div>
                <div className="mt-1 text-sm text-ink-400">{k.description}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <button onClick={() => setNewOpen(true)} className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-600 text-ink-300 transition-colors hover:border-accent hover:text-white">
              <Plus size={28} />
              <span className="text-sm font-medium">Nuevo proyecto</span>
            </button>
            {projects.map((p) => (
              <article key={p.id} className="group relative">
                <button onClick={() => navigateToProject(p.id)} className="block w-full text-left">
                  <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl bg-ink-850 ring-1 ring-ink-700 transition-all group-hover:ring-accent">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <BookOpen className="text-ink-600" size={40} />
                    )}
                    <span className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">{p.kind}</span>
                  </div>
                  <div className="mt-2 px-0.5">
                    <div className="truncate text-sm font-medium text-ink-100">{p.title}</div>
                    <div className="text-xs text-ink-400">
                      {p.pages.length} pág. · {new Date(p.updatedAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </button>
                <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <Menu
                    align="right"
                    trigger={(_, toggle) => (
                      <IconButton label="Opciones" onClick={toggle} className="bg-black/70 text-white hover:bg-black">
                        <MoreHorizontal size={16} />
                      </IconButton>
                    )}
                  >
                    {(close) => (
                      <>
                        <MenuItem icon={<Copy size={14} />} label="Duplicar" onClick={() => (close(), void duplicate(p))} />
                        <MenuItem icon={<Download size={14} />} label="Descargar .vineta" onClick={() => (close(), void exportProject(p))} />
                        <MenuItem icon={<Trash2 size={14} />} label="Eliminar" danger onClick={() => (close(), void remove(p))} />
                      </>
                    )}
                  </Menu>
                </div>
              </article>
            ))}
          </div>
        )}

        <section className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-ink-800 bg-ink-800 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([t, d]) => (
            <div key={t} className="bg-ink-950 p-5">
              <h3 className="text-sm font-semibold text-white">{t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-400">{d}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-ink-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-ink-500 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Viñeta Studio. Tus proyectos no salen de tu navegador.</span>
          <MadeByMateLabs />
        </div>
      </footer>

      <NewProjectDialog open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  )
}
