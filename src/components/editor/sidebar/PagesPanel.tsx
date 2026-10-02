import { useState, useSyncExternalStore } from 'react'
import { ArrowDown, ArrowUp, Copy, GripVertical, Plus, Trash2 } from 'lucide-react'
import { useEditor } from '../../../store/editor'
import { cx, IconButton } from '../../ui/controls'
import { confirmDialog } from '../../ui/Confirm'
import { getThumb, subscribeThumbs } from '../../../lib/thumbs'
import { usePointerReorder } from '../usePointerReorder'

export function PagesPanel() {
  const project = useEditor((s) => s.project)!
  const pageId = useEditor((s) => s.pageId)
  const s = useEditor.getState()
  useSyncExternalStore(subscribeThumbs, () => project.pages.map((p) => getThumb(p.id) ?? '').join('|'))
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const { width, height } = project.format
  const rtl = project.readingDirection === 'rtl'
  // Manija para reordenar con el dedo, el lápiz, el mouse o el teclado (el arrastre HTML5 no anda con touch).
  const { drag, handleProps } = usePointerReorder((from, to) => s.movePage(from, to))

  const remove = async (id: string, name: string) => {
    if (await confirmDialog('Eliminar página', `Se eliminará "${name}". Podés deshacerlo con Ctrl+Z.`, { confirmLabel: 'Eliminar', danger: true })) s.deletePage(id)
  }

  return (
    <div className="p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-ink-400">
          {project.pages.length} páginas{rtl && ' · lectura →←'}
        </span>
        <button onClick={() => s.addPage(undefined, pageId)} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-accent-bright hover:bg-accent-soft">
          <Plus size={14} /> Página
        </button>
      </div>
      <ol className="grid grid-cols-2 gap-3">
        {project.pages.map((p, i) => {
          const thumb = getThumb(p.id)
          const active = p.id === pageId
          return (
            <li
              key={p.id}
              draggable
              onDragStart={(e) => {
                // Si se agarró la manija, manda el arrastre con Pointer Events.
                if (drag) return e.preventDefault()
                setDragFrom(i)
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', String(i))
              }}
              onDragOver={(e) => {
                if (dragFrom === null) return
                e.preventDefault()
                setDragOver(i)
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault()
                if (dragFrom !== null && dragFrom !== i) s.movePage(dragFrom, i)
                setDragFrom(null)
                setDragOver(null)
              }}
              onDragEnd={() => {
                setDragFrom(null)
                setDragOver(null)
              }}
              data-reorder-index={i}
              className={cx('group relative', ((dragOver === i && dragFrom !== i) || (drag && drag.over === i && drag.from !== i)) && 'before:absolute before:-inset-1.5 before:rounded-lg before:ring-2 before:ring-accent/60', drag?.from === i && 'opacity-50')}
            >
              <button onClick={() => s.setPage(p.id)} className="block w-full text-left">
                <div
                  className={cx('overflow-hidden rounded-md bg-white ring-offset-2 ring-offset-ink-850 transition-shadow', active ? 'ring-2 ring-accent' : 'ring-1 ring-ink-600 group-hover:ring-ink-400')}
                  style={{ aspectRatio: `${width} / ${height}`, maxHeight: 220 }}
                >
                  {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" draggable={false} /> : <div className="h-full w-full animate-pulse" style={{ background: p.background }} />}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px]">
                  <span className={cx('font-semibold tabular-nums', active ? 'text-accent-bright' : 'text-ink-400')}>{i + 1}</span>
                  <span className="truncate text-ink-300">{p.name}</span>
                </div>
              </button>
              <div className="absolute top-1 right-1 flex flex-col gap-0.5 rounded-md bg-black/75 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-within:opacity-100">
                <button aria-label={`Mover página ${i + 1} (arrastrá o usá las flechas)`} title="Arrastrá para mover" className="flex size-6 cursor-grab items-center justify-center rounded-md text-white hover:bg-ink-700 pointer-coarse:size-10" {...handleProps(i, project.pages.length)}>
                  <GripVertical size={12} />
                </button>
                <IconButton label="Mover antes" className="size-6 text-white pointer-coarse:size-10" disabled={i === 0} onClick={() => s.movePage(i, i - 1)}>
                  <ArrowUp size={12} />
                </IconButton>
                <IconButton label="Mover después" className="size-6 text-white pointer-coarse:size-10" disabled={i === project.pages.length - 1} onClick={() => s.movePage(i, i + 1)}>
                  <ArrowDown size={12} />
                </IconButton>
                <IconButton label="Duplicar página" className="size-6 text-white pointer-coarse:size-10" onClick={() => s.duplicatePage(p.id)}>
                  <Copy size={12} />
                </IconButton>
                <IconButton label="Eliminar página" className="size-6 text-red-300 pointer-coarse:size-10" onClick={() => void remove(p.id, p.name)}>
                  <Trash2 size={12} />
                </IconButton>
              </div>
            </li>
          )
        })}
        <li>
          <button
            onClick={() => s.addPage()}
            className="flex w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-ink-600 text-ink-400 transition-colors hover:border-accent hover:text-white"
            style={{ aspectRatio: `${width} / ${height}`, maxHeight: 220 }}
          >
            <Plus size={20} />
            <span className="text-[11px]">Nueva página</span>
          </button>
        </li>
      </ol>
    </div>
  )
}
