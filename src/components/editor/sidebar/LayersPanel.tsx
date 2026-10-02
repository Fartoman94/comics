import { useState } from 'react'
import { Brush, Eye, EyeOff, Image, Lock, MessageCircle, SquareDashed, Sparkles, Type, Unlock } from 'lucide-react'
import type { ComicElement } from '../../../types'
import { useCurrentPage, useEditor } from '../../../store/editor'
import { cx, IconButton } from '../../ui/controls'

const ICONS: Record<ComicElement['type'], React.ReactNode> = {
  panel: <SquareDashed size={14} />,
  image: <Image size={14} />,
  bubble: <MessageCircle size={14} />,
  text: <Type size={14} />,
  effect: <Sparkles size={14} />,
  drawing: <Brush size={14} />,
}

export function LayersPanel() {
  const page = useCurrentPage()
  const selection = useEditor((s) => s.selection)
  const s = useEditor.getState()
  const [renaming, setRenaming] = useState<string | null>(null)
  const [drag, setDrag] = useState<{ from: number; over: number | null } | null>(null)
  if (!page) return null
  // La lista se muestra de arriba (frente) hacia abajo (fondo).
  const items = [...page.elements].map((el, i) => ({ el, i })).reverse()

  return (
    <div className="p-2">
      {items.length === 0 && <p className="p-4 text-center text-xs text-ink-500">Esta página está vacía. Aplicá una plantilla de viñetas o insertá elementos.</p>}
      <ul className="space-y-0.5">
        {items.map(({ el, i }) => {
          const sel = selection.includes(el.id)
          return (
            <li
              key={el.id}
              draggable={renaming !== el.id}
              onDragStart={() => setDrag({ from: i, over: null })}
              onDragOver={(e) => {
                if (!drag) return
                e.preventDefault()
                if (drag.over !== i) setDrag({ ...drag, over: i })
              }}
              onDrop={(e) => {
                e.preventDefault()
                if (drag && drag.from !== i) s.reorderElement(page.elements[drag.from].id, i)
                setDrag(null)
              }}
              onDragEnd={() => setDrag(null)}
              onClick={(e) => (e.shiftKey || e.metaKey || e.ctrlKey ? s.toggleSelect(el.id) : s.select([el.id]))}
              onDoubleClick={() => setRenaming(el.id)}
              className={cx(
                'group flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-xs transition-colors',
                sel ? 'bg-accent-soft text-white' : 'text-ink-200 hover:bg-ink-800',
                drag?.over === i && drag.from !== i && 'ring-1 ring-accent',
                el.hidden && 'opacity-50',
              )}
            >
              <span className={cx(sel ? 'text-accent-bright' : 'text-ink-400')}>{ICONS[el.type]}</span>
              {renaming === el.id ? (
                <input
                  autoFocus
                  defaultValue={el.name}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => {
                    s.updateElement(el.id, { name: e.target.value || el.name })
                    setRenaming(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                    if (e.key === 'Escape') setRenaming(null)
                  }}
                  className="h-6 min-w-0 flex-1 rounded bg-ink-900 px-1.5 text-xs outline-none ring-1 ring-accent"
                />
              ) : (
                <span className="min-w-0 flex-1 truncate">{el.name}</span>
              )}
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
            </li>
          )
        })}
      </ul>
      {items.length > 0 && <p className="mt-3 px-2 text-[10px] leading-relaxed text-ink-500">Arrastrá para reordenar · doble clic para renombrar · lo de arriba se ve al frente.</p>}
    </div>
  )
}
