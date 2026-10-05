import { useEffect, useState } from 'react'
import { deleteWithConfirm } from './actions'
import { ArrowDownToLine, ArrowUpToLine, Copy, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { useEditor } from '../../store/editor'
import { cx } from '../ui/controls'
import { SIDEBAR_TABS, SidebarBody, type SidebarTab } from './sidebar/Sidebar'
import { useUi } from '../../store/ui'
import { InspectorBody } from './inspector/Inspector'

type SheetId = SidebarTab | 'props' | null

/**
 * En pantallas chicas los paneles laterales se convierten en hojas inferiores
 * (bottom sheets) y aparece una barra de acciones rápidas para lo seleccionado.
 */
export function MobileBar() {
  const [sheet, setSheet] = useState<SheetId>(null)
  const sidebarOpen = useUi((st) => st.sidebar)
  const selection = useEditor((s) => s.selection)
  const tool = useEditor((s) => s.tool)
  const s = useEditor.getState()

  useEffect(() => {
    // Al elegir el pincel en el móvil conviene ver sus ajustes rápido, pero sin tapar el lienzo al dibujar.
    if (tool === 'brush' || tool === 'eraser') setSheet((cur) => (cur && cur !== 'props' ? null : cur))
  }, [tool])

  const title = sheet === 'props' ? 'Propiedades' : SIDEBAR_TABS.find((t) => t.id === sheet)?.label

  return (
    <>
      {selection.length > 0 && !sheet && (
        <div className="absolute inset-x-0 bottom-16 z-20 flex justify-center px-3 xl:hidden">
          <div className="flex items-center gap-1 rounded-2xl border border-ink-600 bg-ink-800/95 p-1 shadow-2xl backdrop-blur">
            <QuickBtn label="Propiedades" onClick={() => setSheet('props')}>
              <SlidersHorizontal size={17} />
            </QuickBtn>
            <QuickBtn label="Duplicar" onClick={s.duplicateSelection}>
              <Copy size={17} />
            </QuickBtn>
            <QuickBtn label="Al frente" onClick={() => s.arrange('front')}>
              <ArrowUpToLine size={17} />
            </QuickBtn>
            <QuickBtn label="Al fondo" onClick={() => s.arrange('back')}>
              <ArrowDownToLine size={17} />
            </QuickBtn>
            <QuickBtn label="Eliminar" onClick={() => void deleteWithConfirm()} danger>
              <Trash2 size={17} />
            </QuickBtn>
          </div>
        </div>
      )}

      <nav className="flex h-14 shrink-0 items-stretch border-t border-ink-700 bg-ink-900 xl:hidden" aria-label="Paneles">
        {SIDEBAR_TABS.map((t) => (
          <button
            key={t.id}
            data-tour={`tab-${t.id}`}
            onClick={() => setSheet(sheet === t.id ? null : t.id)}
            className={cx('flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px]', sidebarOpen && 'md:hidden', sheet === t.id ? 'text-accent-bright' : 'text-ink-300')}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
        <button data-tour="inspector" onClick={() => setSheet(sheet === 'props' ? null : 'props')} className={cx('flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px]', sheet === 'props' ? 'text-accent-bright' : 'text-ink-300')}>
          <SlidersHorizontal size={16} />
          Ajustes
        </button>
      </nav>

      {sheet && (
        <>
          <div className="fixed inset-0 z-30 bg-black/40 xl:hidden" onClick={() => setSheet(null)} />
          <div className="fixed inset-x-0 bottom-0 z-40 flex max-h-[72vh] flex-col rounded-t-2xl border-t border-ink-600 bg-ink-850 shadow-2xl xl:hidden" role="dialog" aria-label={title}>
            <div className="flex items-center justify-between px-4 pt-2 pb-1">
              <div className="mx-auto h-1 w-10 rounded-full bg-ink-600" />
            </div>
            <div className="flex items-center justify-between border-b border-ink-700 px-4 pb-2">
              <span className="text-sm font-semibold text-white">{title}</span>
              <button onClick={() => setSheet(null)} className="flex size-8 items-center justify-center rounded-md text-ink-300 hover:bg-ink-700" aria-label="Cerrar">
                <X size={17} />
              </button>
            </div>
            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]" onClick={(e) => closeOnInsert(e, () => setSheet(null), sheet)}>
              {sheet === 'props' ? <InspectorBody /> : <SidebarBody tab={sheet} />}
            </div>
          </div>
        </>
      )}
    </>
  )
}

// Tras insertar algo desde la hoja, se cierra para que se vea el resultado en el lienzo.
function closeOnInsert(e: React.MouseEvent, close: () => void, sheet: SheetId) {
  if (sheet !== 'insert' && sheet !== 'assets' && sheet !== 'layouts') return
  const btn = (e.target as HTMLElement).closest('button')
  if (btn && !btn.closest('.no-autoclose')) setTimeout(close, 60)
}

function QuickBtn({ label, onClick, children, danger }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} className={cx('flex size-11 items-center justify-center rounded-xl active:bg-ink-600', danger ? 'text-red-300' : 'text-ink-100')}>
      {children}
    </button>
  )
}
