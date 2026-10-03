import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, BookOpen, CircleHelp, Copy, Download, FileUp, LifeBuoy, MoreHorizontal, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react'
import type { Project } from '../../types'
import { deleteDamagedProject, deleteForever, downloadBlob, duplicateProject, exportRawProjectFile, importProjectFile, listProjectSummaries, listTrash, loadProject, pruneSnapshots, purgeTrash, restoreProject, saveProject, storageUsage, trashProject, TRASH_DAYS, type ProjectSummary, type TrashEntry } from '../../lib/storage'
import { RecoveryCenter, RenameDialog, StorageMeter } from './RecoveryCenter'
import { useUi } from '../../store/ui'
import { ProjectFileError } from '../../lib/projectSchema'
import { settleSaves } from '../../lib/persistence'
import { navigateToProject } from '../../lib/nav'
import { PROJECT_KINDS } from '../../lib/formats'
import { useEditor } from '../../store/editor'
import { Button, IconButton, Menu, MenuItem } from '../ui/controls'
import { MadeByMateLabs, Wordmark } from '../ui/Brand'
import { confirmDialog } from '../ui/Confirm'
import { NewProjectDialog } from './NewProjectDialog'
import { HelpGuide, useHelp } from '../help/HelpGuide'

const FEATURES = [
  ['Plantillas de viñetas', 'Cuadrículas clásicas, cortes diagonales de manga, yonkoma y tiras.'],
  ['Imágenes y fotos', 'Arrastrá tus archivos: rellenan la viñeta y se encuadran con zoom.'],
  ['Globos y onomatopeyas', 'Diálogo, pensamiento, grito, susurro, narración y SFX con contorno.'],
  ['Dibujo con presión', 'Pluma, tinta, lápiz y marcador con soporte para tableta y borrador.'],
  ['Tramas y efectos', 'Tramas de puntos, líneas de velocidad y de impacto estilo manga.'],
  ['Exportá en serio', 'PDF para imprenta, PNG por página, ZIP y tira larga de webtoon.'],
]

const HOW_TO: [string, string, string][] = [
  ['Creá tu proyecto', 'Elegí cómic, manga o webtoon y el tamaño de página. Arranca con portada y viñetas.', 'start'],
  ['Armá las viñetas', 'Aplicá una plantilla o dibujá tus propias viñetas con la herramienta P.', 'panels'],
  ['Sumá imágenes y diálogos', 'Arrastrá tus fotos o dibujos a cada viñeta y agregá globos y onomatopeyas.', 'images'],
  ['Leé y compartí', 'Pasá las páginas como en un libro y exportá en PDF o libro web.', 'read'],
]

type DateFilter = 'all' | '7' | '30'
type SortBy = 'recent' | 'name'

export function Home({ notFound }: { notFound?: boolean }) {
  const [summaries, setSummaries] = useState<ProjectSummary[] | null>(null)
  const [trash, setTrash] = useState<TrashEntry[]>([])
  const [usage, setUsage] = useState<{ usage: number; quota: number; persisted: boolean } | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [renaming, setRenaming] = useState<ProjectSummary | null>(null)
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [sort, setSort] = useState<SortBy>('recent')
  const fileRef = useRef<HTMLInputElement>(null)
  const toast = useEditor((s) => s.toast)
  // "Centro de recuperación" pedido desde Ayuda.
  const request = useUi((s) => s.sheetRequest)
  useEffect(() => {
    if (request?.id === 'recuperacion') {
      setRecoveryOpen(true)
      useUi.setState({ sheetRequest: null })
    }
  }, [request])

  // Espera los guardados pendientes (p. ej. al volver con Atrás) para no listar datos viejos.
  // Se usa el índice liviano: no carga cada proyecto completo.
  const refresh = () =>
    void settleSaves()
      .then(() => Promise.all([listProjectSummaries(), listTrash(), storageUsage().catch(() => null)]))
      .then(([list, t, u]) => {
        setSummaries(list)
        setTrash(t)
        setUsage(u)
      })
      .catch((e) => {
        console.error(e)
        setSummaries([])
        toast('No se pudieron leer los proyectos guardados en este navegador.', 'error')
      })
  useEffect(() => {
    // Limpieza programada: papelera vencida e instantáneas viejas.
    void Promise.allSettled([purgeTrash(), pruneSnapshots()]).then(refresh)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (notFound) toast('Ese proyecto no existe en este navegador', 'error')
  }, [notFound, toast])
  // Aviso antes de quedarse sin espacio (una vez por visita al inicio).
  const warned = useRef(false)
  useEffect(() => {
    if (!warned.current && usage && usage.quota > 0 && usage.usage / usage.quota > 0.8 && (warned.current = true)) toast('Te queda poco espacio de almacenamiento en este navegador. Descargá copias (.vineta) y borrá lo que no uses.', 'error')
  }, [usage, toast])

  const healthy = useMemo(() => (summaries ?? []).filter((p) => !p.damaged), [summaries])
  const damaged = useMemo(() => (summaries ?? []).filter((p) => p.damaged), [summaries])
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
    const since = dateFilter === 'all' ? 0 : Date.now() - Number(dateFilter) * 24 * 3600_000
    const out = healthy.filter((p) => (kindFilter === 'all' || p.kind === kindFilter) && p.updatedAt >= since && (!q || p.title.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(q)))
    return sort === 'name' ? [...out].sort((a, b) => a.title.localeCompare(b.title, 'es')) : out
  }, [healthy, query, kindFilter, dateFilter, sort])

  const onImport = async (f: File | undefined) => {
    if (!f) return
    try {
      const p = await importProjectFile(f)
      toast(`"${p.title}" importado`, 'success')
      refresh()
    } catch (e) {
      console.error(e)
      toast(e instanceof ProjectFileError ? e.message : 'No se pudo importar el archivo.', 'error')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const withProject = async (s: ProjectSummary, fn: (p: Project) => Promise<unknown>) => {
    const p = await loadProject(s.id).catch(() => null)
    if (!p) return toast('No se pudo abrir el proyecto.', 'error')
    await fn(p)
  }
  const duplicate = (s: ProjectSummary) =>
    withProject(s, async (p) => {
      try {
        await duplicateProject(p, { title: `${p.title} (copia)` })
        toast(`"${p.title}" duplicado`, 'success')
      } catch (e) {
        console.error(e)
        toast('No se pudo duplicar el proyecto. ¿El navegador se quedó sin espacio?', 'error')
      }
      refresh()
    })
  // El exportador (y su motor de render) se carga sólo cuando se usa.
  const download = (s: ProjectSummary) => withProject(s, async (p) => (await import('../../lib/export')).downloadProject(p))
  const exportDamaged = async (id: string) => {
    try {
      downloadBlob(await exportRawProjectFile(id), `proyecto-dañado-${id}.vineta`)
    } catch (e) {
      console.error(e)
      toast('No se pudo descargar la copia.', 'error')
    }
  }
  const removeDamaged = async (d: ProjectSummary) => {
    if (!(await confirmDialog('Eliminar proyecto dañado', `"${d.title}" no se puede abrir. Se borrará de este navegador junto con sus imágenes. No se puede deshacer.`, { confirmLabel: 'Eliminar', danger: true }))) return
    await deleteDamagedProject(d.id)
    refresh()
  }

  // Eliminar manda a la papelera: se puede deshacer enseguida o restaurar durante 30 días.
  const remove = async (p: ProjectSummary) => {
    if (!(await confirmDialog('Eliminar proyecto', `"${p.title}" va a la papelera. Podés restaurarlo durante ${TRASH_DAYS} días.`, { confirmLabel: 'Eliminar', danger: true }))) return
    await trashProject(p.id)
    refresh()
    toast(`"${p.title}" se movió a la papelera`, 'info', { label: 'Deshacer', run: () => void restore(p.id) })
  }
  const restore = async (id: string) => {
    await restoreProject(id)
    refresh()
  }
  const destroy = async (t: TrashEntry) => {
    if (!(await confirmDialog('Borrar para siempre', `"${t.project.title}" y sus imágenes se borrarán definitivamente. No se puede deshacer.`, { confirmLabel: 'Borrar', danger: true }))) return
    await deleteForever(t.id)
    refresh()
  }
  const rename = async (s: ProjectSummary, title: string) => {
    setRenaming(null)
    const clean = title.trim()
    if (!clean || clean === s.title) return
    await withProject(s, (p) => saveProject({ ...p, title: clean, updatedAt: Date.now() }))
    refresh()
  }

  return (
    <div className="scroll-thin h-full overflow-y-auto">
      <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Wordmark />
          <div className="flex items-center gap-2">
            {/* En el celular sólo íconos: el botón principal nunca queda cortado. */}
            <Button variant="ghost" onClick={() => useHelp.getState().openGuide('start')} title="Cómo se usa" className="max-sm:px-2.5">
              <CircleHelp size={16} /> <span className="max-sm:sr-only">Cómo se usa</span>
            </Button>
            <Button variant="ghost" onClick={() => fileRef.current?.click()} title="Importar un proyecto (.vineta)" className="max-sm:px-2.5">
              <FileUp size={16} /> <span className="max-sm:sr-only">Importar</span>
            </Button>
            <Button variant="primary" onClick={() => setNewOpen(true)} aria-label="Nuevo proyecto" className="max-sm:px-3">
              <Plus size={16} /> Nuevo<span className="max-sm:hidden"> proyecto</span>
            </Button>
          </div>
          <input ref={fileRef} type="file" accept=".vineta,application/json" hidden onChange={(e) => void onImport(e.target.files?.[0])} />
        </div>
      </header>
      <main>

      <section className="halftone border-b border-ink-800">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-accent-bright uppercase">Estudio de historietas en el navegador</p>
          <h1 className="font-comic max-w-3xl text-5xl leading-[0.95] tracking-wide text-white sm:text-7xl">
            Dibujá, rotulá y publicá tu <span className="text-accent-bright">cómic</span> o <span className="text-accent-bright">manga</span>.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-300">
            Viñetas, fotos, globos, tramas y dibujo con presión en un solo lugar. Todo se guarda automáticamente en tu navegador y se exporta listo para imprimir o publicar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => setNewOpen(true)} className="h-11 px-5 text-base">
              <Plus size={18} /> Empezar un proyecto
            </Button>
            <a href="#/demo" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-ink-700 px-5 text-base font-medium text-ink-100 transition-colors hover:bg-ink-600">
              <BookOpen size={18} /> Ver manga de ejemplo
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <a href="#/demo" className="group grid overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 transition-colors hover:border-accent sm:grid-cols-[220px_1fr]">
          <div className="relative aspect-[3/4] overflow-hidden bg-white sm:aspect-auto sm:h-full">
            <img src="/demo/cover.webp" alt="Portada del manga de ejemplo" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <span className="font-comic absolute right-3 bottom-3 left-3 text-center text-2xl leading-none tracking-wide text-white [text-shadow:0_2px_0_#000,2px_0_0_#000,-2px_0_0_#000,0_-2px_0_#000]">VIENTO DE SAKURA</span>
          </div>
          <div className="flex flex-col justify-center p-6">
            <span className="text-xs font-semibold tracking-[0.2em] text-accent-bright uppercase">Mirá cómo queda</span>
            <h2 className="font-comic mt-2 text-4xl tracking-wide text-white">
              桜の風 <span className="text-ink-400">·</span> Viento de sakura
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-300">
              Un manga corto de ejemplo, hecho completo con Viñeta Studio: viñetas diagonales, tramas, onomatopeyas en japonés y lectura de derecha a izquierda. Pasá las páginas como en un libro y abrilo en el editor para ver cómo está armado.
            </p>
            <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white group-hover:bg-accent-hover">
              <BookOpen size={16} /> Leer el ejemplo
            </span>
          </div>
        </a>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Cómo funciona</h2>
            <p className="text-sm text-ink-400">Cuatro pasos para tu primera página.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => useHelp.getState().openGuide('start')}>
            <CircleHelp size={15} /> Ver la guía completa
          </Button>
        </div>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_TO.map(([title, body, topic], i) => (
            <li key={title}>
              <button onClick={() => useHelp.getState().openGuide(topic)} className="group h-full w-full rounded-xl border border-ink-800 bg-ink-900 p-4 text-left transition-colors hover:border-accent">
                <span className="font-comic text-4xl leading-none text-accent-bright">{i + 1}</span>
                <h3 className="mt-2 text-sm font-semibold text-white">{title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-400">{body}</p>
                <span className="mt-2 inline-block text-xs text-ink-500 group-hover:text-accent-bright">Ver cómo →</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-label="Tus proyectos">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Tus proyectos</h2>
            <p className="text-sm text-ink-400">Guardados en este navegador.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {usage && <StorageMeter usage={usage} />}
            <Button variant="ghost" size="sm" onClick={() => setRecoveryOpen(true)}>
              <LifeBuoy size={15} /> Centro de recuperación
            </Button>
          </div>
        </div>
        {summaries && summaries.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <label className="flex min-w-48 flex-1 items-center gap-2 rounded-lg bg-ink-900 px-2.5 ring-1 ring-ink-700 focus-within:ring-accent">
              <Search size={14} className="text-ink-400" aria-hidden="true" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar proyecto" aria-label="Buscar proyecto" className="h-9 min-w-0 flex-1 bg-transparent text-sm text-white outline-none" />
            </label>
            <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)} aria-label="Tipo de obra" className="h-9 rounded-lg border border-ink-700 bg-ink-900 px-2 text-xs text-white">
              <option value="all">Todos los tipos</option>
              {PROJECT_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)} aria-label="Fecha" className="h-9 rounded-lg border border-ink-700 bg-ink-900 px-2 text-xs text-white">
              <option value="all">Cualquier fecha</option>
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortBy)} aria-label="Ordenar" className="h-9 rounded-lg border border-ink-700 bg-ink-900 px-2 text-xs text-white">
              <option value="recent">Recientes primero</option>
              <option value="name">Por nombre</option>
            </select>
          </div>
        )}

        {summaries === null ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-ink-850" />
            ))}
          </div>
        ) : healthy.length === 0 && !query && kindFilter === 'all' && dateFilter === 'all' ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PROJECT_KINDS.map((k) => (
              <button key={k.id} onClick={() => setNewOpen(true)} className="rounded-xl border border-dashed border-ink-600 p-5 text-left transition-colors hover:border-accent hover:bg-ink-850">
                <div className="font-comic text-2xl tracking-wide text-white">{k.name}</div>
                <div className="mt-1 text-sm text-ink-400">{k.description}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" data-testid="lista-proyectos">
            <button onClick={() => setNewOpen(true)} className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-600 text-ink-300 transition-colors hover:border-accent hover:text-white">
              <Plus size={28} />
              <span className="text-sm font-medium">Nuevo proyecto</span>
            </button>
            {visible.map((p) => (
              <article key={p.id} className="group relative [contain-intrinsic-size:auto_300px] [content-visibility:auto]">
                <button onClick={() => navigateToProject(p.id)} className="block w-full text-left" aria-label={`Abrir ${p.title}`}>
                  <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl bg-ink-850 ring-1 ring-ink-700 transition-all group-hover:ring-accent">
                    {p.thumbnail ? <img src={p.thumbnail} alt="" loading="lazy" className="h-full w-full object-contain" /> : <BookOpen className="text-ink-600" size={40} />}
                    <span className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">{p.kind}</span>
                  </div>
                  <div className="mt-2 px-0.5">
                    <div className="truncate text-sm font-medium text-ink-100">{p.title}</div>
                    <div className="text-xs text-ink-400">
                      {p.pages} pág. · {new Date(p.updatedAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} · <span className="text-emerald-400/80">Guardado</span>
                    </div>
                  </div>
                </button>
                <div className="absolute top-2 right-2 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-within:opacity-100">
                  <Menu
                    align="right"
                    trigger={(_, toggle) => (
                      <IconButton label="Opciones" onClick={toggle} className="bg-black/70 text-white hover:bg-black pointer-coarse:size-11">
                        <MoreHorizontal size={16} />
                      </IconButton>
                    )}
                  >
                    {(close) => (
                      <>
                        <MenuItem icon={<BookOpen size={14} />} label="Abrir" onClick={() => (close(), navigateToProject(p.id))} />
                        <MenuItem icon={<Pencil size={14} />} label="Renombrar" onClick={() => (close(), setRenaming(p))} />
                        <MenuItem icon={<Copy size={14} />} label="Duplicar" onClick={() => (close(), void duplicate(p))} />
                        <MenuItem icon={<Download size={14} />} label="Descargar .vineta" onClick={() => (close(), void download(p))} />
                        <MenuItem icon={<Trash2 size={14} />} label="Eliminar" danger onClick={() => (close(), void remove(p))} />
                      </>
                    )}
                  </Menu>
                </div>
              </article>
            ))}
          </div>
        )}
        {summaries && healthy.length > 0 && visible.length === 0 && <p className="mt-3 text-sm text-ink-400">Ningún proyecto coincide con la búsqueda.</p>}

        {damaged.length > 0 && (
          <section className="mt-8 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4" aria-labelledby="damaged-title">
            <h3 id="damaged-title" className="flex items-center gap-2 text-sm font-semibold text-amber-200">
              <AlertTriangle size={16} /> Proyectos que no se pueden abrir
            </h3>
            <p className="mt-1 text-xs text-ink-300">Tienen datos dañados. Podés descargar una copia para revisarla o eliminarlos. El resto de tus proyectos no se ve afectado.</p>
            <ul className="mt-3 space-y-2">
              {damaged.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-ink-900 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-100">{d.title}</span>
                  <span className="hidden text-[11px] text-ink-400 sm:inline">{d.damaged}</span>
                  <Button size="sm" variant="ghost" onClick={() => void exportDamaged(d.id)}>
                    <Download size={14} /> Descargar copia
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void removeDamaged(d)}>
                    <Trash2 size={14} /> Eliminar
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {trash.length > 0 && (
          <details className="mt-8 rounded-xl border border-ink-800 bg-ink-900/50 p-4" data-testid="papelera">
            <summary className="cursor-pointer text-sm font-semibold text-ink-200">
              Papelera ({trash.length}) <span className="font-normal text-ink-500">· se vacía sola a los {TRASH_DAYS} días</span>
            </summary>
            <ul className="mt-3 space-y-2">
              {trash.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-ink-900 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-100">{t.project.title}</span>
                  <span className="text-[11px] text-ink-500">borrado el {new Date(t.deletedAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                  <Button size="sm" variant="ghost" onClick={() => void restore(t.id)}>
                    <RotateCcw size={14} /> Restaurar
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void destroy(t)}>
                    <Trash2 size={14} /> Borrar para siempre
                  </Button>
                </li>
              ))}
            </ul>
          </details>
        )}

        <section className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-ink-800 bg-ink-800 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([t, d]) => (
            <div key={t} className="bg-ink-950 p-5">
              <h3 className="text-sm font-semibold text-white">{t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-400">{d}</p>
            </div>
          ))}
        </section>
      </section>
      </main>

      <footer className="border-t border-ink-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-ink-500 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Viñeta Studio. Tus proyectos no salen de tu navegador.</span>
          <MadeByMateLabs />
        </div>
      </footer>

      <NewProjectDialog open={newOpen} onClose={() => setNewOpen(false)} />
      <RenameDialog project={renaming} onClose={() => setRenaming(null)} onSave={(t) => renaming && void rename(renaming, t)} />
      <RecoveryCenter open={recoveryOpen} onClose={() => (setRecoveryOpen(false), refresh())} />
      <HelpGuide />
    </div>
  )
}
