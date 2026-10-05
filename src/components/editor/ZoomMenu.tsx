import { Maximize, MoveHorizontal, ScanSearch } from 'lucide-react'
import { useEditor } from '../../store/editor'
import { Menu, MenuItem } from '../ui/controls'

const LEVELS = [0.25, 0.5, 0.75, 1, 1.5, 2, 4]

/** Porcentaje de zoom con menú: ajustar página, ajustar ancho, 100 % y niveles fijos. El zoom no toca el documento. */
export function ZoomMenu() {
  const zoom = useEditor((s) => s.zoom)
  const s = useEditor.getState()
  return (
    <Menu
      align="right"
      trigger={(open, toggle) => (
        <button className="w-14 text-center text-xs text-ink-200 tabular-nums hover:text-white" aria-label={`Zoom ${Math.round(zoom * 100)} %`} aria-expanded={open} title="Opciones de zoom" onClick={toggle}>
          {Math.round(zoom * 100)}%
        </button>
      )}
    >
      {(close) => (
        <div className="w-56" role="group" aria-label="Zoom">
          <MenuItem label="Ajustar página" hint="Ctrl 0" icon={<Maximize size={14} />} onClick={() => (close(), s.requestFit('page'))} />
          <MenuItem label="Ajustar ancho" hint="Ctrl 2" icon={<MoveHorizontal size={14} />} onClick={() => (close(), s.requestFit('width'))} />
          <MenuItem label="Tamaño real (100 %)" hint="Ctrl 1" icon={<ScanSearch size={14} />} onClick={() => (close(), s.setZoom(1))} />
          <div className="my-1 h-px bg-ink-700" />
          <div className="grid grid-cols-4 gap-1 p-1">
            {LEVELS.map((z) => (
              <button key={z} onClick={() => (close(), s.setZoom(z))} className="rounded-md py-1 text-[11px] text-ink-200 tabular-nums hover:bg-ink-700 hover:text-white">
                {z * 100}%
              </button>
            ))}
          </div>
          <p className="px-2 pt-1 pb-1.5 text-[10px] text-ink-500">Ctrl + rueda o pellizcar: zoom al puntero · Espacio o la mano: mover el lienzo.</p>
        </div>
      )}
    </Menu>
  )
}
