import { useEffect, useMemo, useState } from 'react'
import { LayoutGrid, List, Pencil, Save, Search, Star, Trash2 } from 'lucide-react'
import { useEditor } from '../../../store/editor'
import { forgetAsset, getAssetUrl, useAssetImage } from '../../../lib/assetCache'
import { deleteLibraryItem, listLibrary, updateLibraryItem, type LibraryCategory, type LibraryItem } from '../../../lib/storage'
import { insertLibraryItem, saveSelectionToLibrary } from '../../../lib/library'
import { cx, IconButton } from '../../ui/controls'
import { confirmDialog } from '../../ui/Confirm'

const CATEGORIES: { id: LibraryCategory; label: string }[] = [
  { id: 'personajes', label: 'Personajes' },
  { id: 'fondos', label: 'Fondos' },
  { id: 'objetos', label: 'Objetos' },
  { id: 'texturas', label: 'Texturas' },
  { id: 'otros', label: 'Otros' },
]
type Orientation = 'all' | 'vertical' | 'horizontal' | 'cuadrada'
type Sort = 'recent' | 'name' | 'date'

const dims = (it: LibraryItem) => (it.type === 'image' ? { w: it.asset.width, h: it.asset.height } : { w: it.width, h: it.height })
const orientationOf = (it: LibraryItem): Exclude<Orientation, 'all'> => {
  const { w, h } = dims(it)
  return w / h > 1.15 ? 'horizontal' : h / w > 1.15 ? 'vertical' : 'cuadrada'
}
const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

/**
 * Biblioteca del usuario: imágenes y elementos reutilizables de todos sus proyectos. Buscar,
 * filtrar, marcar favoritos, renombrar/etiquetar (sin tocar la imagen) e insertar con un toque o arrastrando.
 */
export function LibraryPanel() {
  const [items, setItems] = useState<LibraryItem[] | null>(null)
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'all' | 'image' | 'composition'>('all')
  const [cat, setCat] = useState<LibraryCategory | 'all'>('all')
  const [orient, setOrient] = useState<Orientation>('all')
  const [source, setSource] = useState('all')
  const [favs, setFavs] = useState(false)
  const [sort, setSort] = useState<Sort>('recent')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [editing, setEditing] = useState<string | null>(null)
  const [naming, setNaming] = useState<string | null>(null)
  const hasSelection = useEditor((s) => s.selection.length > 0)
  const projectAssets = useEditor((s) => s.project?.assets)
  const s = useEditor.getState()

  const refresh = () => void listLibrary().then(setItems).catch(() => setItems([]))
  useEffect(refresh, [])
  // Las vistas previas de la biblioteca se liberan al cerrar el panel (salvo las que usa el proyecto).
  useEffect(
    () => () => {
      const keep = new Set(useEditor.getState().project?.assets.map((a) => a.id))
      for (const it of items ?? []) if (it.type === 'image' && !keep.has(it.asset.id)) forgetAsset(it.asset.id)
    },
    [items],
  )

  const sources = useMemo(() => [...new Map((items ?? []).filter((i) => i.sourceProjectId).map((i) => [i.sourceProjectId!, i.sourceTitle ?? 'Proyecto'])).entries()], [items])
  const list = useMemo(() => {
    const q = normalize(query.trim())
    const out = (items ?? []).filter(
      (it) =>
        (type === 'all' || it.type === type) &&
        (cat === 'all' || it.category === cat) &&
        (orient === 'all' || orientationOf(it) === orient) &&
        (source === 'all' || it.sourceProjectId === source) &&
        (!favs || it.favorite) &&
        (!q || normalize(`${it.name} ${it.tags.join(' ')}`).includes(q)),
    )
    if (sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name, 'es'))
    if (sort === 'date') out.sort((a, b) => b.createdAt - a.createdAt)
    return out
  }, [items, query, type, cat, orient, source, favs, sort])

  const remove = async (it: LibraryItem) => {
    if (!(await confirmDialog('Quitar de la biblioteca', `"${it.name}" se quita de la biblioteca. Los proyectos que ya la usan no cambian.`, { confirmLabel: 'Quitar', danger: true }))) return
    await deleteLibraryItem(it.id)
    refresh()
  }
  const saveSelection = async (name: string) => {
    setNaming(null)
    try {
      await saveSelectionToLibrary(name.trim() || 'Elemento')
      s.toast('Guardado en la biblioteca como elemento reutilizable', 'success')
      refresh()
    } catch (e) {
      console.error(e)
      s.toast('No se pudo guardar en la biblioteca.', 'error')
    }
  }
  const chip = (on: boolean) => cx('min-h-8 rounded-full px-2.5 text-[11px] pointer-coarse:min-h-10', on ? 'bg-accent text-white' : 'bg-ink-900 text-ink-300 ring-1 ring-ink-700 hover:text-white')
  const sel = 'h-8 rounded-md border border-ink-600 bg-ink-900 px-1.5 text-[11px] text-white pointer-coarse:h-10'

  return (
    <div className="space-y-3 p-3" data-testid="biblioteca">
      {hasSelection &&
        (naming !== null ? (
          <form
            className="no-autoclose flex gap-1"
            onSubmit={(e) => {
              e.preventDefault()
              void saveSelection(naming)
            }}
          >
            <input autoFocus value={naming} onChange={(e) => setNaming(e.target.value)} aria-label="Nombre del elemento reutilizable" className="h-9 min-w-0 flex-1 rounded-lg border border-accent bg-ink-900 px-2 text-xs text-white outline-none" />
            <button type="submit" className="h-9 rounded-lg bg-accent px-3 text-xs font-medium text-white">
              Guardar
            </button>
          </form>
        ) : (
          <button onClick={() => setNaming('')} className="no-autoclose flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-accent/60 py-2 text-xs text-ink-100 hover:bg-accent-soft pointer-coarse:min-h-11">
            <Save size={14} /> Guardar lo seleccionado como elemento reutilizable
          </button>
        ))}

      <div className="no-autoclose space-y-2">
        <label className="flex items-center gap-2 rounded-lg bg-ink-900 px-2.5 ring-1 ring-ink-700 focus-within:ring-accent">
          <Search size={14} className="text-ink-400" aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre o etiqueta" aria-label="Buscar en la biblioteca" className="h-9 min-w-0 flex-1 bg-transparent text-xs text-white outline-none" />
        </label>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Categoría">
          <button className={chip(cat === 'all')} aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
            Todo
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className={chip(cat === c.id)} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
              {c.label}
            </button>
          ))}
          <button className={chip(favs)} aria-pressed={favs} onClick={() => setFavs(!favs)}>
            ★ Favoritos
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)} aria-label="Tipo" className={sel}>
            <option value="all">Imágenes y elementos</option>
            <option value="image">Sólo imágenes</option>
            <option value="composition">Elementos reutilizables</option>
          </select>
          <select value={orient} onChange={(e) => setOrient(e.target.value as Orientation)} aria-label="Orientación" className={sel}>
            <option value="all">Cualquier forma</option>
            <option value="vertical">Vertical</option>
            <option value="horizontal">Horizontal</option>
            <option value="cuadrada">Cuadrada</option>
          </select>
          <select value={source} onChange={(e) => setSource(e.target.value)} aria-label="Proyecto de origen" className={sel}>
            <option value="all">De todos los proyectos</option>
            {sources.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Orden" className={sel}>
            <option value="recent">Usados recientemente</option>
            <option value="date">Más nuevos</option>
            <option value="name">Por nombre</option>
          </select>
          <span className="flex-1" />
          <IconButton label="Ver en grilla" active={view === 'grid'} onClick={() => setView('grid')} className="pointer-coarse:size-10">
            <LayoutGrid size={14} />
          </IconButton>
          <IconButton label="Ver en lista" active={view === 'list'} onClick={() => setView('list')} className="pointer-coarse:size-10">
            <List size={14} />
          </IconButton>
        </div>
      </div>

      {items === null ? null : items.length === 0 ? (
        <p className="text-center text-xs leading-relaxed text-ink-400">
          Tu biblioteca está vacía. Las imágenes que subas (o pegues, o arrastres) en cualquier proyecto aparecen acá para reutilizarlas. También podés guardar una selección como elemento reutilizable.
        </p>
      ) : list.length === 0 ? (
        <p className="text-center text-xs text-ink-400">Nada coincide con esos filtros.</p>
      ) : (
        <ul className={view === 'grid' ? 'grid grid-cols-3 gap-2' : 'space-y-1'} aria-label="Biblioteca">
          {list.map((it) =>
            editing === it.id ? (
              <ItemEditor key={it.id} item={it} onDone={() => (setEditing(null), refresh())} />
            ) : (
              <LibraryTile key={it.id} item={it} list={view === 'list'} inProject={!!projectAssets?.some((a) => it.type === 'image' && a.id === it.asset.id)} onInsert={() => insertLibraryItem(it)} onFav={() => void updateLibraryItem(it.id, { favorite: !it.favorite }).then(refresh)} onEdit={() => setEditing(it.id)} onDelete={() => void remove(it)} />
            ),
          )}
        </ul>
      )}
    </div>
  )
}

function LibraryTile({ item, list, inProject, onInsert, onFav, onEdit, onDelete }: { item: LibraryItem; list: boolean; inProject: boolean; onInsert: () => void; onFav: () => void; onEdit: () => void; onDelete: () => void }) {
  useAssetImage(item.type === 'image' ? item.asset.id : null)
  const url = item.type === 'image' ? getAssetUrl(item.asset.id) : undefined
  const thumb = (
    <button
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-vineta-library', item.id)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      onClick={onInsert}
      aria-label={`Insertar ${item.name}`}
      title={`${item.name}${item.tags.length ? ` · ${item.tags.join(', ')}` : ''}`}
      className={cx('block shrink-0 overflow-hidden rounded-md bg-ink-900 ring-1 ring-ink-700 hover:ring-accent', list ? 'size-12' : 'aspect-square w-full')}
      style={{ backgroundImage: 'conic-gradient(#26262e 25%, #1c1c22 0 50%, #26262e 0 75%, #1c1c22 0)', backgroundSize: '12px 12px' }}
    >
      {item.type === 'image' ? url && <img src={url} alt="" className="h-full w-full object-contain" draggable={false} /> : <CompositionPreview item={item} />}
    </button>
  )
  const actions = (
    <div className="flex items-center gap-0.5">
      <IconButton label={item.favorite ? 'Quitar de favoritos' : 'Marcar como favorito'} onClick={onFav} className={cx('size-7 pointer-coarse:size-10', item.favorite && 'text-amber-300')}>
        <Star size={13} fill={item.favorite ? 'currentColor' : 'none'} />
      </IconButton>
      <IconButton label="Renombrar o etiquetar" onClick={onEdit} className="size-7 pointer-coarse:size-10">
        <Pencil size={13} />
      </IconButton>
      <IconButton label="Quitar de la biblioteca" onClick={onDelete} className="size-7 text-red-300 pointer-coarse:size-10">
        <Trash2 size={13} />
      </IconButton>
    </div>
  )
  return list ? (
    <li className="flex items-center gap-2 rounded-lg bg-ink-900 p-1.5 ring-1 ring-ink-700" data-library-item={item.id}>
      {thumb}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs text-white">{item.name}</span>
        <span className="block truncate text-[10px] text-ink-400">
          {item.type === 'image' ? `${item.asset.width}×${item.asset.height}` : `${item.elements.length} elementos`} · {CATEGORIES.find((c) => c.id === item.category)?.label}
          {inProject && ' · en este proyecto'}
        </span>
      </span>
      {actions}
    </li>
  ) : (
    <li className="flex flex-col gap-1" data-library-item={item.id}>
      {thumb}
      <span className="truncate text-center text-[10px] text-ink-300">{item.name}</span>
      <div className="flex justify-center">{actions}</div>
    </li>
  )
}

function ItemEditor({ item, onDone }: { item: LibraryItem; onDone: () => void }) {
  const [name, setName] = useState(item.name)
  const [category, setCategory] = useState(item.category)
  const [tags, setTags] = useState(item.tags.join(', '))
  return (
    <li className="col-span-3 rounded-lg bg-ink-900 p-2 ring-1 ring-accent">
      <form
        className="no-autoclose space-y-1.5"
        onSubmit={(e) => {
          e.preventDefault()
          void updateLibraryItem(item.id, { name: name.trim() || item.name, category, tags: tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 20) }).then(onDone)
        }}
      >
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} aria-label="Nombre" className="h-8 w-full rounded border border-ink-600 bg-ink-950 px-2 text-xs text-white" />
        <select value={category} onChange={(e) => setCategory(e.target.value as LibraryCategory)} aria-label="Categoría" className="h-8 w-full rounded border border-ink-600 bg-ink-950 px-1 text-xs text-white">
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Etiquetas separadas por coma" aria-label="Etiquetas" className="h-8 w-full rounded border border-ink-600 bg-ink-950 px-2 text-xs text-white" />
        <div className="flex justify-end gap-1">
          <button type="button" onClick={onDone} className="h-8 rounded px-2 text-xs text-ink-300">
            Cancelar
          </button>
          <button type="submit" className="h-8 rounded bg-accent px-3 text-xs font-medium text-white">
            Guardar
          </button>
        </div>
      </form>
    </li>
  )
}

/** Miniatura de un elemento reutilizable: las cajas de sus partes en su composición real. */
function CompositionPreview({ item }: { item: LibraryItem & { type: 'composition' } }) {
  const k = 90 / Math.max(item.width, item.height, 1)
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      {item.elements.map((e) =>
        e.type === 'bubble' || e.type === 'text' ? (
          <ellipse key={e.id} cx={5 + (e.x + e.width / 2) * k} cy={5 + (e.y + e.height / 2) * k} rx={(e.width / 2) * k} ry={(e.height / 2) * k} fill="#fff" stroke="#111" strokeWidth={1.5} />
        ) : (
          <rect key={e.id} x={5 + e.x * k} y={5 + e.y * k} width={e.width * k} height={e.height * k} fill={e.type === 'image' || (e.type === 'panel' && e.image) ? '#9ca3af' : '#e7e5e4'} stroke="#111" strokeWidth={1.5} />
        ),
      )}
    </svg>
  )
}
