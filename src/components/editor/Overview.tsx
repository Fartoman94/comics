import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { plural } from '../../lib/plural'
import { ArrowLeft, ChevronLeft, ChevronRight, ClipboardCopy, ClipboardPaste, Copy, GripVertical, LayoutTemplate, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Page } from '../../types'
import { useEditor } from '../../store/editor'
import { getThumb, setThumb, subscribeThumbs, thumbIsFresh } from '../../lib/thumbs'
import { renderPage } from '../../lib/render'
import { useFocusTrap } from '../ui/useFocusTrap'
import { cx, IconButton } from '../ui/controls'
import { confirmDialog } from '../ui/Confirm'
import { useReadingOverlay } from './Reader'

// Las miniaturas que faltan se generan a medida que aparecen en pantalla, de a una.
let thumbQueue: Promise<unknown> = Promise.resolve()
function requestThumb(page: Page) {
  thumbQueue = thumbQueue.then(async () => {
    const project = useEditor.getState().project
    const current = project?.pages.find((p) => p.id === page.id)
    if (!project || !current || thumbIsFresh(current.id, current)) return
    const ratio = Math.min(0.25, 220 / project.format.width)
    setThumb(current.id, await renderPage(project, current, { pixelRatio: ratio, mime: 'image/jpeg', quality: 0.8 }), current)
  }).catch(() => undefined)
}

/** Vista general: todas las páginas para navegar, reordenar y organizar (mouse, teclado y touch). */
export function Overview({ onClose }: { onClose: () => void }) {
  const project = useEditor((s) => s.project)!
  const pageId = useEditor((s) => s.pageId)
  const hasPagesClip = useEditor((s) => !!s.clipboard?.pages?.length)
  const s = useEditor.getState()
  useReadingOverlay()
  const trapRef = useRef<HTMLDivElement>(null)
  useFocusTrap(trapRef)
  useSyncExternalStore(subscribeThumbs, () => project.pages.map((p) => getThumb(p.id) ?? '').join('|'))
  const [drag, setDrag] = useState<{ from: number; over: number } | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const focusAfter = useRef<string | null>(null)
  const { width, height } = project.format

  useEffect(() => {
    // Esc cierra la vista, salvo que haya un diálogo encima (p. ej. confirmar eliminar) o se esté renombrando.
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !renaming && document.querySelectorAll('[role=dialog][aria-modal=true]').length <= 1 && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, renaming])

  // Después de mover con teclado, el foco sigue a la página movida.
  useEffect(() => {
    if (!focusAfter.current) return
    document.querySelector<HTMLElement>(`[data-handle-id="${focusAfter.current}"]`)?.focus()
    focusAfter.current = null
  })

  const open = (id: string) => {
    s.setPage(id)
    onClose()
  }
  const move = (from: number, to: number) => {
    if (to < 0 || to >= project.pages.length || from === to) return
    focusAfter.current = project.pages[from].id
    s.movePage(from, to)
  }
  const remove = async (p: Page) => {
    if (await confirmDialog('Eliminar página', `Se eliminará "${p.name}". Podés deshacerlo con Ctrl+Z.`, { confirmLabel: 'Eliminar', danger: true })) s.deletePage(p.id)
  }
  const rename = (id: string, name: string) => {
    setRenaming(null)
    const clean = name.trim()
    if (clean) s.mutate((d) => void (d.pages.find((p) => p.id === id)!.name = clean))
  }

  // Reordenar arrastrando la manija con Pointer Events: funciona igual con mouse, dedo y lápiz.
  const overFrom = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-page-index]')
    return el ? Number(el.dataset.pageIndex) : null
  }

  return (
    <div ref={trapRef} tabIndex={-1} className="fixed inset-0 z-50 flex flex-col bg-ink-950 text-ink-100" role="dialog" aria-modal="true" aria-label="Vista general de páginas">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-ink-700 bg-ink-900 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button onClick={onClose} className="flex h-9 items-center gap-1.5 rounded-lg bg-ink-700 px-3 text-sm hover:bg-ink-600" aria-label="Volver al editor">
          <ArrowLeft size={16} /> Volver
        </button>
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">
          Vista general · {plural(project.pages.length, 'página', 'páginas')}
        </h2>
        {hasPagesClip && (
          <button onClick={() => void s.pastePages(project.pages.at(-1)?.id)} className="flex h-9 items-center gap-1.5 rounded-lg bg-ink-700 px-3 text-xs hover:bg-ink-600">
            <ClipboardPaste size={15} /> Pegar página
          </button>
        )}
        <button onClick={() => s.addPage(undefined, project.pages.at(-1)?.id)} className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-white hover:bg-accent-hover">
          <Plus size={15} /> Página
        </button>
      </header>
      <p className="px-4 pt-3 text-xs text-ink-400">Tocá una página para abrirla. Arrastrá la manija <GripVertical size={12} className="inline" /> o usá las flechas del teclado sobre ella para cambiar el orden.</p>
      <ol className="scroll-thin grid flex-1 auto-rows-max grid-cols-2 gap-4 overflow-y-auto p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" data-testid="vista-general">
        {project.pages.map((p, i) => (
          <OverviewCard
            key={p.id}
            page={p}
            index={i}
            total={project.pages.length}
            active={p.id === pageId}
            ratio={`${width} / ${height}`}
            dropTarget={!!drag && drag.over === i && drag.from !== i}
            dragging={drag?.from === i}
            renaming={renaming === p.id}
            onOpen={() => open(p.id)}
            onMove={(to) => move(i, to)}
            onDuplicate={() => s.duplicatePage(p.id)}
            onCopy={() => s.copyPages([p.id])}
            onStructure={() => s.duplicatePageStructure(p.id)}
            onRename={() => setRenaming(p.id)}
            onRenamed={(name) => rename(p.id, name)}
            onCancelRename={() => setRenaming(null)}
            onDelete={() => void remove(p)}
            onHandleDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              setDrag({ from: i, over: i })
            }}
            onHandleMove={(e) => {
              if (!drag) return
              const over = overFrom(e.clientX, e.clientY)
              if (over !== null && over !== drag.over) setDrag({ ...drag, over })
            }}
            onHandleUp={() => {
              if (drag && drag.over !== drag.from) move(drag.from, drag.over)
              setDrag(null)
            }}
          />
        ))}
      </ol>
    </div>
  )
}

function OverviewCard(props: {
  page: Page
  index: number
  total: number
  active: boolean
  ratio: string
  dropTarget: boolean
  dragging: boolean
  renaming: boolean
  onOpen: () => void
  onMove: (to: number) => void
  onDuplicate: () => void
  onCopy: () => void
  onStructure: () => void
  onRename: () => void
  onRenamed: (name: string) => void
  onCancelRename: () => void
  onDelete: () => void
  onHandleDown: (e: React.PointerEvent<HTMLButtonElement>) => void
  onHandleMove: (e: React.PointerEvent<HTMLButtonElement>) => void
  onHandleUp: () => void
}) {
  const { page, index, total } = props
  const ref = useRef<HTMLLIElement>(null)
  const thumb = getThumb(page.id)
  // Miniatura bajo demanda: sólo de las páginas que se ven.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && requestThumb(page), { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [page])

  return (
    <li ref={ref} data-page-index={index} className={cx('relative flex flex-col gap-1.5 rounded-xl p-1.5 [contain-intrinsic-size:auto_320px] [content-visibility:auto]', props.dropTarget && 'ring-2 ring-accent', props.dragging && 'opacity-50')}>
      <button onClick={props.onOpen} className="block w-full text-left" aria-label={`Abrir página ${index + 1}: ${page.name}`} aria-current={props.active ? 'page' : undefined}>
        <div className={cx('overflow-hidden rounded-md bg-white ring-offset-2 ring-offset-ink-950', props.active ? 'ring-2 ring-accent' : 'ring-1 ring-ink-600')} style={{ aspectRatio: props.ratio }}>
          {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" draggable={false} /> : <div className="h-full w-full animate-pulse" style={{ background: page.background }} />}
        </div>
      </button>
      <div className="flex items-center gap-1 text-[11px]">
        <span className={cx('font-semibold tabular-nums', props.active ? 'text-accent-bright' : 'text-ink-300')}>{index + 1}</span>
        {props.renaming ? (
          <input
            autoFocus
            defaultValue={page.name}
            aria-label="Nombre de la página"
            className="h-6 min-w-0 flex-1 rounded border border-accent bg-ink-900 px-1 text-[11px] text-white outline-none"
            onBlur={(e) => props.onRenamed(e.currentTarget.value)}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter') props.onRenamed(e.currentTarget.value)
              if (e.key === 'Escape') props.onCancelRename()
            }}
          />
        ) : (
          <span className="truncate text-ink-200">{page.name}</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-0.5">
        <button
          data-handle-id={page.id}
          aria-label={`Mover página ${index + 1} (arrastrá o usá las flechas)`}
          title="Arrastrá o usá las flechas para mover"
          className="flex size-7 pointer-coarse:size-11 cursor-grab touch-none items-center justify-center rounded-md text-ink-300 hover:bg-ink-700 active:cursor-grabbing"
          onPointerDown={props.onHandleDown}
          onPointerMove={props.onHandleMove}
          onPointerUp={props.onHandleUp}
          onPointerCancel={props.onHandleUp}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') (e.preventDefault(), props.onMove(index - 1))
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') (e.preventDefault(), props.onMove(index + 1))
          }}
        >
          <GripVertical size={14} />
        </button>
        <IconButton label="Mover antes" className="size-7 pointer-coarse:size-11" disabled={index === 0} onClick={() => props.onMove(index - 1)}>
          <ChevronLeft size={14} />
        </IconButton>
        <IconButton label="Mover después" className="size-7 pointer-coarse:size-11" disabled={index === total - 1} onClick={() => props.onMove(index + 1)}>
          <ChevronRight size={14} />
        </IconButton>
        <IconButton label="Duplicar página" className="size-7 pointer-coarse:size-11" onClick={props.onDuplicate}>
          <Copy size={14} />
        </IconButton>
        <IconButton label="Duplicar estructura sin contenido" className="size-7 pointer-coarse:size-11" onClick={props.onStructure}>
          <LayoutTemplate size={14} />
        </IconButton>
        <IconButton label="Copiar página" className="size-7 pointer-coarse:size-11" onClick={props.onCopy}>
          <ClipboardCopy size={14} />
        </IconButton>
        <IconButton label="Renombrar página" className="size-7 pointer-coarse:size-11" onClick={props.onRename}>
          <Pencil size={14} />
        </IconButton>
        <IconButton label="Eliminar página" className="size-7 text-red-300 pointer-coarse:size-11" onClick={props.onDelete}>
          <Trash2 size={14} />
        </IconButton>
      </div>
    </li>
  )
}
