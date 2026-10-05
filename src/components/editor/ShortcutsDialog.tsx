import { Kbd, Modal } from '../ui/controls'

const GROUPS: [string, [string, string][]][] = [
  [
    'Herramientas',
    [
      ['V', 'Seleccionar'],
      ['H / Espacio', 'Mano'],
      ['P', 'Dibujar viñeta'],
      ['G', 'Globo de diálogo'],
      ['T', 'Texto'],
      ['B', 'Pincel'],
      ['E', 'Borrador'],
      ['[ / ]', 'Tamaño del pincel'],
    ],
  ],
  [
    'Edición',
    [
      ['Ctrl Z', 'Deshacer'],
      ['Ctrl Shift Z', 'Rehacer'],
      ['Ctrl C / X / V', 'Copiar / cortar / pegar'],
      ['Ctrl D', 'Duplicar'],
      ['Ctrl A', 'Seleccionar todo'],
      ['Supr', 'Eliminar'],
      ['Flechas', 'Mover 1 px (Shift: 10 px)'],
      ['Ctrl ] / [', 'Subir / bajar capa'],
      ['Doble clic', 'Editar texto · encuadrar imagen'],
      ['Enter / Esc', 'Al escribir: confirmar / cancelar'],
      ['Shift Enter', 'Al escribir: nueva línea'],
      ['Alt al arrastrar', 'Sin imanes'],
      ['Ctrl al arrastrar', 'Viñeta: mover sólo el marco'],
    ],
  ],
  [
    'Vista',
    [
      ['Ctrl + / -', 'Zoom'],
      ['Ctrl 0', 'Ajustar página'],
      ['Ctrl 1', 'Tamaño real (100 %)'],
      ['Ctrl 2', 'Ajustar ancho'],
      ['Espacio + arrastrar', 'Mover el lienzo'],
      ['Ctrl + rueda', 'Zoom al puntero'],
      ['Re Pág / Av Pág', 'Página anterior / siguiente'],
      ['Esc', 'Salir / deseleccionar'],
    ],
  ],
]

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Atajos de teclado" width="max-w-2xl">
      <div className="grid gap-6 p-5 sm:grid-cols-3">
        {GROUPS.map(([title, items]) => (
          <div key={title}>
            <h3 className="mb-2 text-[11px] font-semibold tracking-wider text-ink-400 uppercase">{title}</h3>
            <ul className="space-y-1.5">
              {items.map(([k, d]) => (
                <li key={k} className="flex items-center justify-between gap-2 text-xs text-ink-200">
                  <span>{d}</span>
                  <Kbd>{k}</Kbd>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  )
}
