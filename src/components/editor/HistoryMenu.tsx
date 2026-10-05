import { useMemo } from 'react'
import { History, Undo2 } from 'lucide-react'
import { useEditor } from '../../store/editor'
import { describeChange, type HistorySnapshot } from '../../lib/history'
import { cx, IconButton, Menu } from '../ui/controls'

// Las frases se calculan una vez por par de estados (los estados del historial no cambian).
const labelCache = new WeakMap<HistorySnapshot, WeakMap<HistorySnapshot, string>>()
function label(a: HistorySnapshot, b: HistorySnapshot) {
  let inner = labelCache.get(a)
  if (!inner) labelCache.set(a, (inner = new WeakMap()))
  let v = inner.get(b)
  if (v === undefined) inner.set(b, (v = describeChange(a, b)))
  return v
}

/** Historial visible: operaciones recientes; un clic vuelve a ese punto (deshacer/rehacer varias). */
export function HistoryMenu() {
  return (
    <Menu
      align="left"
      trigger={(open, toggle) => (
        <IconButton label="Historial de cambios" active={open} onClick={toggle}>
          <History size={16} />
        </IconButton>
      )}
    >
      {(close) => <HistoryList onPick={close} />}
    </Menu>
  )
}

function HistoryList({ onPick }: { onPick: () => void }) {
  const past = useEditor((s) => s.past)
  const future = useEditor((s) => s.future)
  const project = useEditor((s) => s.project)
  const current = useMemo(() => {
    if (!project) return null
    const { assets: _a, thumbnail: _t, ...rest } = project
    return rest as HistorySnapshot
  }, [project])
  if (!current) return null
  // Hechas: past[i] → past[i+1] (o el estado actual). Deshechas: actual → future[0] → future[1]…
  const done = past.map((snap, i) => ({ i, text: label(snap, past[i + 1] ?? current) }))
  const undone = future.map((snap, j) => ({ j, text: label(j === 0 ? current : future[j - 1], snap) }))
  const jump = (steps: number) => {
    useEditor.getState().jumpHistory(steps)
    onPick()
  }
  return (
    <div className="w-72" role="group" aria-label="Historial de cambios">
      <div className="flex items-center justify-between px-2 pt-1 pb-2 text-[11px] text-ink-400">
        <span>Historial · {past.length} cambio(s)</span>
        <span>Clic para volver ahí</span>
      </div>
      <ol className="scroll-thin max-h-80 overflow-y-auto">
        {[...undone].reverse().map(({ j, text }) => (
          <li key={`f${j}`}>
            <button onClick={() => jump(j + 1)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-ink-500 line-through decoration-ink-600 hover:bg-ink-700 hover:text-ink-200 hover:no-underline">
              {text}
            </button>
          </li>
        ))}
        {[...done].reverse().map(({ i, text }, k) => (
          <li key={`p${i}`}>
            <button
              onClick={() => jump(-(past.length - 1 - i))}
              aria-current={k === 0 ? 'step' : undefined}
              className={cx('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-ink-700', k === 0 ? 'font-medium text-fg' : 'text-ink-200')}
            >
              {k === 0 && <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />}
              {text}
            </button>
          </li>
        ))}
        <li>
          <button onClick={() => jump(-past.length)} disabled={!past.length} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-ink-400 hover:bg-ink-700 disabled:opacity-50">
            <Undo2 size={12} /> Estado al abrir el proyecto
          </button>
        </li>
      </ol>
    </div>
  )
}
