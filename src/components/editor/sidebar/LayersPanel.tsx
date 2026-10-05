import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownToLine, ArrowUpToLine, Brush, ChevronDown, ChevronRight, ChevronUp, Copy, Eye, EyeOff, File, Image, Lock, MessageCircle, Shapes, SquareDashed, Sparkles, Trash2, Type, Unlock } from 'lucide-react'
import type { ComicElement, Page } from '../../../types'
import { useCurrentPage, useEditor } from '../../../store/editor'
import { childrenOf, parentPanelOf, TYPE_LABEL } from '../../../lib/hierarchy'
import { cx, IconButton } from '../../ui/controls'
import { deleteWithConfirm } from '../actions'

const ICONS: Record<ComicElement['type'], React.ReactNode> = {
  panel: <SquareDashed size={14} />,
  image: <Image size={14} />,
  bubble: <MessageCircle size={14} />,
  text: <Type size={14} />,
  effect: <Sparkles size={14} />,
  drawing: <Brush size={14} />,
  shape: <Shapes size={14} />,
}

interface LayerNode {
  el: ComicElement
  /** Posición en la pila de la página (0 = fondo). */
  z: number
  children: LayerNode[]
}

/**
 * Jerarquía Página > Viñeta > elementos, de adelante (arriba) hacia atrás (abajo). La relación con
 * la viñeta se deduce por geometría (ver lib/hierarchy): lo que tiene su centro dentro de una
 * viñeta y está por encima de ella aparece anidado.
 */
export function buildLayerTree(page: Page): LayerNode[] {
  const z = new Map(page.elements.map((e, i) => [e.id, i]))
  const front = (a: LayerNode, b: LayerNode) => b.z - a.z
  const roots: LayerNode[] = []
  for (const el of page.elements) {
    if (parentPanelOf(page, el)) continue
    const children = el.type === 'panel' ? childrenOf(page, el).map((c) => ({ el: c, z: z.get(c.id)!, children: [] })) : []
    roots.push({ el, z: z.get(el.id)!, children: children.sort(front) })
  }
  return roots.sort(front)
}

export function LayersPanel() {
  const page = useCurrentPage()
  const pageIndex = useEditor((s) => s.project?.pages.findIndex((p) => p.id === s.pageId) ?? 0)
  const selection = useEditor((s) => s.selection)
  const s = useEditor.getState()
  const [renaming, setRenaming] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<string[]>([])
  const [drag, setDrag] = useState<{ id: string; over: string | null } | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const tree = useMemo(() => (page ? buildLayerTree(page) : []), [page])

  // Seleccionar en el lienzo resalta (y muestra) la fila en Capas: se despliega su viñeta.
  const hiddenParents = useMemo(() => {
    if (!page) return []
    return selection
      .map((id) => page.elements.find((e) => e.id === id))
      .map((el) => (el ? parentPanelOf(page, el)?.id : undefined))
      .filter((p): p is string => !!p && collapsed.includes(p))
  }, [selection, page, collapsed])
  const effectiveCollapsed = hiddenParents.length ? collapsed.filter((c) => !hiddenParents.includes(c)) : collapsed
  useEffect(() => {
    if (!selection.length) return
    const t = setTimeout(() => listRef.current?.querySelector(`[data-layer-id="${selection[0]}"]`)?.scrollIntoView({ block: 'nearest' }), 0)
    return () => clearTimeout(t)
  }, [selection])

  if (!page) return null
  const count = page.elements.length
  const hasSel = selection.length > 0

  const rowFor = (n: LayerNode, depth: number): React.ReactNode => {
    const { el } = n
    const sel = selection.includes(el.id)
    const open = !effectiveCollapsed.includes(el.id)
    return (
      <li key={el.id} role="treeitem" aria-selected={sel} aria-level={depth + 2} aria-expanded={n.children.length ? open : undefined}>
        <div
          data-layer-id={el.id}
          draggable={renaming !== el.id}
          tabIndex={0}
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move'
            setDrag({ id: el.id, over: null })
          }}
          onDragOver={(e) => {
            if (!drag) return
            e.preventDefault()
            if (drag.over !== el.id) setDrag({ ...drag, over: el.id })
          }}
          onDrop={(e) => {
            e.preventDefault()
            // Soltar sobre una fila deja el elemento a la altura de esa fila en la pila.
            if (drag && drag.id !== el.id) s.reorderElement(drag.id, n.z)
            setDrag(null)
          }}
          onDragEnd={() => setDrag(null)}
          onClick={(e) => (e.shiftKey || e.metaKey || e.ctrlKey ? s.toggleSelect(el.id) : s.select([el.id]))}
          onDoubleClick={() => setRenaming(el.id)}
          onKeyDown={(e) => {
            if (renaming) return
            if (e.key === 'F2') setRenaming(el.id)
            else if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              s.select([el.id])
            } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
              e.preventDefault()
              e.stopPropagation()
              if (!selection.includes(el.id)) s.select([el.id])
              useEditor.getState().arrange(e.key === 'ArrowUp' ? 'forward' : 'backward')
            }
          }}
          style={{ paddingLeft: 8 + depth * 18 }}
          className={cx(
            'group flex h-9 cursor-pointer items-center gap-2 rounded-md pr-1 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent',
            sel ? 'bg-accent-soft text-white' : 'text-ink-200 hover:bg-ink-800',
            drag?.over === el.id && drag.id !== el.id && 'ring-1 ring-accent',
            el.hidden && 'opacity-50',
          )}
        >
          {n.children.length ? (
            <button
              aria-label={open ? `Plegar ${el.name}` : `Desplegar ${el.name}`}
              className="-ml-1 flex size-5 items-center justify-center rounded text-ink-400 hover:bg-ink-700 hover:text-white"
              onClick={(e) => {
                e.stopPropagation()
                setCollapsed((c) => (open ? [...c, el.id] : c.filter((x) => x !== el.id)))
              }}
            >
              {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : (
            depth === 0 && <span className="-ml-1 size-5" aria-hidden />
          )}
          <span className={cx(sel ? 'text-accent-bright' : 'text-ink-400')} title={TYPE_LABEL[el.type]}>
            {ICONS[el.type]}
          </span>
          {renaming === el.id ? (
            <input
              autoFocus
              defaultValue={el.name}
              aria-label="Nombre de la capa"
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => {
                const v = e.target.value.trim()
                if (v && v !== el.name) s.updateElement(el.id, { name: v.slice(0, 80) })
                setRenaming(null)
              }}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                if (e.key === 'Escape') setRenaming(null)
              }}
              className="h-6 min-w-0 flex-1 rounded bg-ink-900 px-1.5 text-xs ring-1 ring-accent outline-none"
            />
          ) : (
            <span className="min-w-0 flex-1 truncate">{el.name}</span>
          )}
          {n.children.length > 0 && <span className="rounded bg-ink-700 px-1 text-[9px] text-ink-300 tabular-nums">{n.children.length}</span>}
          {el.blend && el.blend !== 'source-over' && <span className="text-[9px] text-ink-400 uppercase">{el.blend.slice(0, 4)}</span>}
          <IconButton
            label={el.locked ? 'Desbloquear' : 'Bloquear'}
            className={cx('size-6 pointer-coarse:size-10', !el.locked && '[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100')}
            onClick={(e) => {
              e.stopPropagation()
              s.updateElement(el.id, { locked: !el.locked })
            }}
          >
            {el.locked ? <Lock size={12} /> : <Unlock size={12} />}
          </IconButton>
          <IconButton
            label={el.hidden ? 'Mostrar' : 'Ocultar'}
            className={cx('size-6 pointer-coarse:size-10', !el.hidden && '[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100')}
            onClick={(e) => {
              e.stopPropagation()
              s.updateElement(el.id, { hidden: !el.hidden })
            }}
          >
            {el.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
          </IconButton>
        </div>
        {n.children.length > 0 && open && (
          <ul role="group" className="space-y-0.5">
            {n.children.map((c) => rowFor(c, depth + 1))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <div className="p-2" ref={listRef}>
      <div className="sticky top-0 z-10 mb-1 flex items-center gap-0.5 rounded-md bg-ink-850/95 py-1 backdrop-blur" role="toolbar" aria-label="Acciones de capas">
        <span className="flex-1 truncate px-1 text-[11px] text-ink-400">{hasSel ? `${selection.length} seleccionado(s)` : `${count} elementos`}</span>
        <IconButton label="Traer al frente" className="size-7" disabled={!hasSel} onClick={() => s.arrange('front')}>
          <ArrowUpToLine size={13} />
        </IconButton>
        <IconButton label="Traer adelante" className="size-7" disabled={!hasSel} onClick={() => s.arrange('forward')}>
          <ChevronUp size={13} />
        </IconButton>
        <IconButton label="Enviar atrás" className="size-7" disabled={!hasSel} onClick={() => s.arrange('backward')}>
          <ChevronDown size={13} />
        </IconButton>
        <IconButton label="Enviar al fondo" className="size-7" disabled={!hasSel} onClick={() => s.arrange('back')}>
          <ArrowDownToLine size={13} />
        </IconButton>
        <IconButton label="Duplicar selección" className="size-7" disabled={!hasSel} onClick={() => s.duplicateSelection()}>
          <Copy size={13} />
        </IconButton>
        <IconButton label="Eliminar selección" className="size-7 hover:text-red-300" disabled={!hasSel} onClick={() => void deleteWithConfirm()}>
          <Trash2 size={13} />
        </IconButton>
      </div>
      <ul role="tree" aria-label="Capas de la página" className="space-y-0.5">
        <li role="treeitem" aria-selected={!hasSel} aria-level={1} aria-expanded>
          <button onClick={() => s.select([])} className={cx('flex h-8 w-full items-center gap-2 rounded-md px-2 text-xs font-medium', !hasSel ? 'text-white' : 'text-ink-300 hover:bg-ink-800')}>
            <File size={14} className="text-ink-400" />
            <span className="truncate">
              Página {pageIndex + 1} · {page.name}
            </span>
          </button>
          {count === 0 ? (
            <p className="p-4 text-center text-xs text-ink-500">Esta página está vacía. Aplicá una plantilla o insertá elementos.</p>
          ) : (
            <ul role="group" className="space-y-0.5">
              {tree.map((n) => rowFor(n, 0))}
            </ul>
          )}
        </li>
      </ul>
      {count > 0 && (
        <p className="mt-3 px-2 text-[10px] leading-relaxed text-ink-500">
          Arriba = al frente. Arrastrá para reordenar (Alt+↑/↓ con teclado) · doble clic o F2 renombra · Shift+clic suma a la selección · lo bloqueado se selecciona acá para desbloquearlo.
        </p>
      )}
    </div>
  )
}
