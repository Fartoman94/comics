import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ClipboardCopy, Copy, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEditor } from '../../../store/editor'
import { useUi } from '../../../store/ui'
import { getThumb, subscribeThumbs } from '../../../lib/thumbs'
import { cx, IconButton, Menu, MenuItem } from '../../ui/controls'
import { deletePageWithConfirm, openCopyContent, openRenamePage } from './PageDialogs'

/**
 * Tira de páginas bajo el lienzo: miniaturas reales (las mismas instantáneas que la lista de
 * Páginas, no páginas renderizadas en vivo), anterior/siguiente, salto directo, reordenar
 * arrastrando y acciones de la página actual.
 */
export function PageFilmstrip() {
  const open = useUi((s) => s.filmstrip)
  const project = useEditor((s) => s.project)!
  const pageId = useEditor((s) => s.pageId)
  const index = project.pages.findIndex((p) => p.id === pageId)
  const total = project.pages.length
  const s = useEditor.getState()
  useSyncExternalStore(subscribeThumbs, () => project.pages.map((p) => getThumb(p.id) ?? '').join('|'))
  const listRef = useRef<HTMLOListElement>(null)
  const [drag, setDrag] = useState<{ from: number; over: number; moved: boolean } | null>(null)
  const [jump, setJump] = useState<string | null>(null)
  const ratio = project.format.width / project.format.height

  // La página actual siempre queda a la vista en la tira.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-page-id="${pageId}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [pageId, open])

  const current = project.pages[index]
  const overAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-film-index]')
    return el ? Number(el.dataset.filmIndex) : null
  }

  return (
    <div className="hidden shrink-0 border-t border-ink-700 bg-ink-900 md:block" data-testid="tira-paginas">
      <div className="flex h-9 items-center gap-1 px-2 text-xs text-ink-300">
        <IconButton label={open ? 'Plegar tira de páginas' : 'Mostrar tira de páginas'} className="size-7" onClick={() => useUi.getState().setFilmstrip(!open)}>
          {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </IconButton>
        <IconButton label="Anterior (Re Pág)" className="size-7" disabled={index <= 0} onClick={() => s.goToPage(index - 1)}>
          <ChevronLeft size={14} />
        </IconButton>
        <label className="flex items-center gap-1">
          <span className="sr-only">Ir a la página</span>
          <input
            inputMode="numeric"
            aria-label="Ir a la página"
            value={jump ?? String(index + 1)}
            onFocus={(e) => {
              setJump(String(index + 1))
              e.target.select()
            }}
            onChange={(e) => setJump(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onBlur={() => setJump(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const n = Number(jump)
                if (n >= 1) s.goToPage(Math.min(total, n) - 1)
                ;(e.target as HTMLInputElement).blur()
              }
              if (e.key === 'Escape') (e.target as HTMLInputElement).blur()
            }}
            className="h-6 w-9 rounded border border-ink-600 bg-ink-850 text-center text-xs text-fg tabular-nums outline-none focus:border-accent"
          />
          <span className="tabular-nums text-ink-400">/ {total}</span>
        </label>
        <IconButton label="Siguiente (Av Pág)" className="size-7" disabled={index >= total - 1} onClick={() => s.goToPage(index + 1)}>
          <ChevronRight size={14} />
        </IconButton>
        <span className="ml-1 min-w-0 truncate text-ink-200" title={current?.name}>
          {current?.name}
        </span>
        <div className="flex-1" />
        <IconButton label="Agregar página después de esta" className="size-7" onClick={() => s.addPage(undefined, pageId)}>
          <Plus size={14} />
        </IconButton>
        <Menu
          align="right"
          placement="up"
          trigger={(_, toggle) => (
            <IconButton label="Acciones de la página actual" className="size-7" onClick={toggle}>
              <MoreHorizontal size={14} />
            </IconButton>
          )}
        >
          {(close) => (
            <>
              <MenuItem label="Renombrar" icon={<Pencil size={14} />} onClick={() => (close(), openRenamePage(pageId))} />
              <MenuItem label="Duplicar" icon={<Copy size={14} />} onClick={() => (close(), s.duplicatePage(pageId))} />
              <MenuItem label="Copiar contenido a…" icon={<ClipboardCopy size={14} />} disabled={!current?.elements.length || total < 2} onClick={() => (close(), openCopyContent(pageId))} />
              <MenuItem label="Eliminar" icon={<Trash2 size={14} />} danger disabled={total <= 1} onClick={() => (close(), void deletePageWithConfirm(pageId))} />
            </>
          )}
        </Menu>
      </div>
      {open && (
        <ol ref={listRef} className="scroll-thin flex h-[88px] items-start gap-2 overflow-x-auto px-2 pb-2" aria-label="Páginas">
          {project.pages.map((p, i) => {
            const thumb = getThumb(p.id)
            const active = p.id === pageId
            const target = drag && drag.moved && drag.over === i && drag.from !== i
            return (
              <li key={p.id} data-film-index={i} data-page-id={p.id} className={cx('relative shrink-0', drag?.moved && drag.from === i && 'opacity-40')}>
                <button
                  aria-label={`Página ${i + 1}: ${p.name}`}
                  aria-current={active ? 'page' : undefined}
                  title={`${i + 1}. ${p.name} — arrastrá para reordenar`}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return
                    e.currentTarget.setPointerCapture(e.pointerId)
                    setDrag({ from: i, over: i, moved: false })
                  }}
                  onPointerMove={(e) => {
                    if (!drag) return
                    const over = overAt(e.clientX, e.clientY)
                    if (over !== null && (over !== drag.over || !drag.moved)) setDrag({ ...drag, over, moved: drag.moved || over !== drag.from })
                  }}
                  onPointerUp={() => {
                    if (drag?.moved && drag.over !== drag.from) s.movePage(drag.from, drag.over)
                    else s.setPage(p.id)
                    setDrag(null)
                  }}
                  onPointerCancel={() => setDrag(null)}
                  onKeyDown={(e) => {
                    // Alt + flechas mueve la página; Enter/Espacio la abre (el clic normal).
                    if (!e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
                    e.preventDefault()
                    const to = i + (e.key === 'ArrowRight' ? 1 : -1)
                    if (to >= 0 && to < total) s.movePage(i, to)
                  }}
                  onClick={(e) => {
                    // Teclado (Enter/Espacio): el puntero ya resolvió el clic en pointerup.
                    if (e.detail === 0) s.setPage(p.id)
                  }}
                  onDoubleClick={() => openRenamePage(p.id)}
                  style={{ touchAction: 'pan-x' }}
                  className={cx(
                    'block overflow-hidden rounded-sm bg-white ring-offset-1 ring-offset-ink-900 transition-shadow',
                    active ? 'ring-2 ring-accent' : 'ring-1 ring-ink-600 hover:ring-ink-300',
                    target && 'ring-2 ring-accent-bright',
                  )}
                >
                  <span className="block" style={{ height: 64, width: Math.round(64 * ratio) }}>
                    {thumb ? <img src={thumb} alt="" draggable={false} className="h-full w-full object-cover" /> : <span className="block h-full w-full animate-pulse" style={{ background: p.background }} />}
                  </span>
                </button>
                <span className={cx('mt-0.5 block text-center text-[10px] tabular-nums', active ? 'font-semibold text-accent-bright' : 'text-ink-400')}>{i + 1}</span>
              </li>
            )
          })}
          <li className="shrink-0">
            <button onClick={() => s.addPage()} aria-label="Agregar página al final" title="Agregar página al final" className="flex items-center justify-center rounded-sm border border-dashed border-ink-600 text-ink-400 hover:border-accent hover:text-fg" style={{ height: 64, width: Math.round(64 * ratio) }}>
              <Plus size={16} />
            </button>
          </li>
        </ol>
      )}
    </div>
  )
}
