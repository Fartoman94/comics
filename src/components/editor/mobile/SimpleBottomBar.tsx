import { useEffect, useRef, useState } from 'react'
import { ArrowDownToLine, ArrowUpToLine, Brush, Check, Copy, Crop, Eraser, Files, ImagePlus, Images, Layers, LayoutGrid, MessageCircle, Minus, PenLine, Plus, SlidersHorizontal, SquareDashed, Trash2, Type, Undo2 } from 'lucide-react'
import type { ComicElement } from '../../../types'
import { currentPage, placementFor, useEditor, useSelectedElements } from '../../../store/editor'
import { createBubble, createDrawing, createText, TEXT_PRESETS } from '../../../lib/factories'
import { importFiles, placeAsset } from '../../../lib/placement'
import { cx } from '../../ui/controls'
import { PagesPanel } from '../sidebar/PagesPanel'
import { LayoutsPanel } from '../sidebar/LayoutsPanel'
import { AssetsPanel } from '../sidebar/AssetsPanel'
import { InsertPanel } from '../sidebar/InsertPanel'
import { LayersPanel } from '../sidebar/LayersPanel'
import { ScriptPanel } from '../sidebar/ScriptPanel'
import { useUi } from '../../../store/ui'
import { InspectorBody } from '../inspector/Inspector'
import { pickImageFor } from '../CanvasStage'
import { BottomSheet } from './BottomSheet'
import { Tip } from './Tip'

type Group = 'pages' | 'design' | 'images' | 'text' | 'layers'
type Sheet = Group | 'props' | 'add' | 'script' | null

const GROUPS: { id: Group; label: string; icon: React.ReactNode; title: string }[] = [
  { id: 'pages', label: 'Páginas', icon: <Files size={20} />, title: 'Páginas' },
  { id: 'design', label: 'Diseñar', icon: <LayoutGrid size={20} />, title: 'Diseñar la página' },
  { id: 'images', label: 'Imágenes', icon: <Images size={20} />, title: 'Imágenes y fotos' },
  { id: 'text', label: 'Texto', icon: <MessageCircle size={20} />, title: 'Globos, textos y onomatopeyas' },
  { id: 'layers', label: 'Capas', icon: <Layers size={20} />, title: 'Capas' },
]

// Microayudas: aparecen la primera vez que se abre cada grupo.
const TIPS: Record<Group, string> = {
  pages: 'Tocá una página para editarla. Para cambiar el orden arrastrá la manija o usá los botones de mover.',
  design: 'Tocá una plantilla para armar las viñetas de esta página. Más abajo están los efectos manga y el dibujo a mano.',
  images: 'Subí fotos o dibujos. Si tenés una viñeta seleccionada, la imagen que toques la rellena.',
  text: 'Elegí un globo o un texto y escribí directamente. Las onomatopeyas se insertan listas.',
  layers: 'Lo que está arriba en la lista tapa a lo de abajo. El ojo oculta y el candado bloquea.',
}

/**
 * Modo simple: barra inferior con cinco grupos, hojas inferiores con las mismas herramientas del
 * modo estudio, acciones contextuales para lo seleccionado y un botón "+" para agregar.
 */
export function SimpleBottomBar() {
  const [sheet, setSheet] = useState<Sheet>(null)
  // El menú "⋯" puede pedir abrir una hoja (por ejemplo, el guion).
  const request = useUi((s) => s.sheetRequest)
  useEffect(() => {
    if (request?.id === 'script') setSheet('script')
  }, [request])
  const selection = useEditor((s) => s.selection)
  const tool = useEditor((s) => s.tool)
  const editing = useEditor((s) => !!s.editingTextId || !!s.croppingPanelId)
  const close = () => setSheet(null)
  const group = GROUPS.find((g) => g.id === sheet)
  const drawing = tool === 'brush' || tool === 'eraser'

  return (
    <>
      {!sheet && !editing && (
        // Sobre el lienzo, justo encima de la barra inferior (sin taparla).
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-20 flex flex-col items-center gap-2 px-2 pb-2">
          {drawing ? <DrawingBar onSettings={() => setSheet('props')} /> : tool === 'panel' ? <PanelToolBar /> : selection.length > 0 ? <ContextBar onMore={() => setSheet('props')} /> : null}
          {!drawing && tool !== 'panel' && selection.length === 0 && (
            <button onClick={() => setSheet('add')} className="pointer-events-auto absolute right-3 bottom-3 flex size-14 items-center justify-center rounded-full bg-accent text-white shadow-2xl hover:bg-accent-hover" aria-label="Agregar contenido" title="Agregar">
              <Plus size={26} />
            </button>
          )}
        </div>
      )}

      <nav className="flex shrink-0 items-stretch border-t border-ink-700 bg-ink-900 pb-[env(safe-area-inset-bottom)]" aria-label="Herramientas">
        {GROUPS.map((g) => (
          <button key={g.id} onClick={() => setSheet(sheet === g.id ? null : g.id)} aria-pressed={sheet === g.id} className={cx('flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px]', sheet === g.id ? 'text-accent-bright' : 'text-ink-200')}>
            {g.icon}
            {g.label}
          </button>
        ))}
      </nav>

      {group && (
        <BottomSheet title={group.title} onClose={close} onBodyClick={(e) => autoClose(e, close, group.id)}>
          <Tip id={`grupo-${group.id}`}>{TIPS[group.id]}</Tip>
          {group.id === 'pages' && <PagesPanel />}
          {group.id === 'design' && (
            <>
              <LayoutsPanel />
              <InsertPanel sections={['effects', 'drawing']} />
            </>
          )}
          {group.id === 'images' && <AssetsPanel />}
          {group.id === 'text' && <InsertPanel sections={['bubbles', 'texts', 'sfx']} editOnInsert />}
          {group.id === 'layers' && <LayersPanel />}
        </BottomSheet>
      )}
      {sheet === 'props' && (
        <BottomSheet title="Todas las opciones" onClose={close}>
          <InspectorBody />
        </BottomSheet>
      )}
      {sheet === 'script' && (
        <BottomSheet title="Guion" onClose={close}>
          <ScriptPanel />
        </BottomSheet>
      )}
      {sheet === 'add' && (
        <BottomSheet title="Agregar" onClose={close}>
          <AddMenu onDone={close} />
        </BottomSheet>
      )}
    </>
  )
}

// Al insertar algo desde la hoja, se cierra para ver el resultado en el lienzo.
function autoClose(e: React.MouseEvent, close: () => void, group: Group) {
  if (group !== 'text' && group !== 'images' && group !== 'design') return
  const btn = (e.target as HTMLElement).closest('button')
  if (btn && !btn.closest('.no-autoclose') && !btn.closest('[data-tip]')) setTimeout(close, 60)
}

function Action({ label, onClick, children, danger, disabled }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} className={cx('flex min-h-14 min-w-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 text-[10px] active:bg-ink-600 disabled:opacity-35', danger ? 'text-red-300' : 'text-ink-100')}>
      {children}
      <span aria-hidden="true">{label}</span>
    </button>
  )
}

function Bar({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="pointer-events-auto flex max-w-full items-center gap-0.5 overflow-x-auto rounded-2xl border border-ink-600 bg-ink-800/95 p-1 shadow-2xl backdrop-blur" role="toolbar" aria-label={label}>
      {children}
    </div>
  )
}

/** Las 3–5 acciones más usadas según lo seleccionado; "Más" abre el inspector completo. */
function ContextBar({ onMore }: { onMore: () => void }) {
  const els = useSelectedElements()
  const s = useEditor.getState()
  const el: ComicElement | undefined = els.length === 1 ? els[0] : undefined
  const del = <Action label="Eliminar" onClick={s.deleteSelection} danger><Trash2 size={19} /></Action>
  const dup = <Action label="Duplicar" onClick={s.duplicateSelection}><Copy size={19} /></Action>
  const more = <Action label="Más" onClick={onMore}><SlidersHorizontal size={19} /></Action>
  const font = (k: number) =>
    el &&
    (el.type === 'text' || el.type === 'bubble') &&
    s.updateElement(el.id, { fontSize: Math.max(6, Math.round(el.fontSize * k)) } as Partial<ComicElement>, 'font')
  let actions: React.ReactNode
  if (el?.type === 'bubble' || el?.type === 'text')
    actions = (
      <>
        <Action label="Escribir" onClick={() => s.setEditingText(el.id)}><PenLine size={19} /></Action>
        <Action label="Achicar" onClick={() => font(1 / 1.15)}><Minus size={19} /></Action>
        <Action label="Agrandar" onClick={() => font(1.15)}><Plus size={19} /></Action>
        {dup}
        {del}
      </>
    )
  else if (el?.type === 'panel')
    actions = (
      <>
        <Action label={el.image ? 'Cambiar foto' : 'Poner foto'} onClick={() => pickImageFor(el.id)}><ImagePlus size={19} /></Action>
        {el.image && <Action label="Encuadrar" onClick={() => s.setCropping(el.id)}><Crop size={19} /></Action>}
        <Action label="Duplicar escena" onClick={() => s.duplicatePanelWithContent(el.id)}><Copy size={19} /></Action>
        {del}
      </>
    )
  else if (el?.type === 'image')
    actions = (
      <>
        <Action label="Recortar" onClick={() => s.setCropping(el.id)}><Crop size={19} /></Action>
        <Action label="Al frente" onClick={() => s.arrange('front')}><ArrowUpToLine size={19} /></Action>
        {dup}
        {del}
      </>
    )
  else if (el?.type === 'drawing')
    actions = (
      <>
        <Action label="Pincel" onClick={() => s.setTool('brush')}><Brush size={19} /></Action>
        <Action label="Borrador" onClick={() => s.setTool('eraser')}><Eraser size={19} /></Action>
        <Action label="Quitar trazo" disabled={!el.strokes.length} onClick={() => s.updateElement(el.id, (d) => void (d.type === 'drawing' && (d.strokes = d.strokes.slice(0, -1))))}><Undo2 size={19} /></Action>
        {del}
      </>
    )
  else
    actions = (
      <>
        <Action label="Al frente" onClick={() => s.arrange('front')}><ArrowUpToLine size={19} /></Action>
        <Action label="Al fondo" onClick={() => s.arrange('back')}><ArrowDownToLine size={19} /></Action>
        {dup}
        {del}
      </>
    )
  return (
    <>
      <div className="pointer-events-auto w-full max-w-md">
        <Tip id="contexto">Estas son las acciones más usadas para lo que seleccionaste. «Más» abre todas las opciones.</Tip>
      </div>
      <Bar label="Acciones de lo seleccionado">
        {actions}
        {more}
      </Bar>
    </>
  )
}

/** Con el pincel o el borrador activos: cambiar de herramienta, ajustes y "Listo" para volver. */
function DrawingBar({ onSettings }: { onSettings: () => void }) {
  const tool = useEditor((s) => s.tool)
  const s = useEditor.getState()
  return (
    <Bar label="Dibujo">
      <Action label="Pincel" onClick={() => s.setTool('brush')}><Brush size={19} className={tool === 'brush' ? 'text-accent-bright' : ''} /></Action>
      <Action label="Borrador" onClick={() => s.setTool('eraser')}><Eraser size={19} className={tool === 'eraser' ? 'text-accent-bright' : ''} /></Action>
      <Action label="Ajustes" onClick={onSettings}><SlidersHorizontal size={19} /></Action>
      <Action label="Listo" onClick={() => s.setTool('select')}><Check size={19} className="text-emerald-400" /></Action>
    </Bar>
  )
}

function PanelToolBar() {
  const s = useEditor.getState()
  return (
    <Bar label="Dibujar viñeta">
      <span className="px-3 text-xs text-ink-200">Arrastrá sobre la página para dibujar una viñeta</span>
      <Action label="Listo" onClick={() => s.setTool('select')}><Check size={19} className="text-emerald-400" /></Action>
    </Bar>
  )
}

/** Botón "+": lo más común para agregar, con el mismo motor que el resto del editor. */
function AddMenu({ onDone }: { onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const s = useEditor.getState()
  const format = s.project!.format
  const scale = format.width / 900
  const center = (w: number, h: number) => placementFor(w, h)
  const go = (fn: () => void) => () => {
    fn()
    onDone()
  }
  const items: { label: string; desc: string; icon: React.ReactNode; run: () => void }[] = [
    {
      label: 'Globo',
      desc: 'Diálogo para escribir',
      icon: <MessageCircle size={22} />,
      run: go(() => {
        const b = createBubble('speech', 0, 0, scale)
        Object.assign(b, center(b.width, b.height))
        s.addElements([b])
        setTimeout(() => useEditor.getState().setEditingText(b.id), 120)
      }),
    },
    {
      label: 'Texto',
      desc: 'Título o narración',
      icon: <Type size={22} />,
      run: go(() => {
        const t = createText(0, 0, TEXT_PRESETS[4])
        t.fontSize = Math.round(format.width / 28)
        t.width = Math.round(format.width / 2)
        t.height = Math.round(t.fontSize * 1.4)
        Object.assign(t, center(t.width, t.height))
        s.addElements([t])
        setTimeout(() => useEditor.getState().setEditingText(t.id), 120)
      }),
    },
    { label: 'Foto o imagen', desc: 'Desde tu teléfono o computadora', icon: <ImagePlus size={22} />, run: () => fileRef.current?.click() },
    { label: 'Viñeta', desc: 'Dibujala arrastrando el dedo', icon: <SquareDashed size={22} />, run: go(() => s.setTool('panel')) },
    {
      label: 'Dibujo',
      desc: 'Capa nueva con pincel',
      icon: <Brush size={22} />,
      run: go(() => {
        s.addElements([createDrawing(format.width, format.height)])
        s.setTool('brush')
      }),
    },
    { label: 'Página', desc: 'Después de la actual', icon: <Files size={22} />, run: go(() => s.addPage(undefined, s.pageId)) },
  ]
  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {items.map((it) => (
        <button key={it.label} onClick={it.run} className="flex min-h-16 items-center gap-3 rounded-xl bg-ink-900 p-3 text-left ring-1 ring-ink-700 active:bg-ink-700">
          <span className="text-accent-bright">{it.icon}</span>
          <span>
            <span className="block text-sm font-medium text-white">{it.label}</span>
            <span className="block text-[11px] text-ink-400">{it.desc}</span>
          </span>
        </button>
      ))}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        data-testid="agregar-imagen"
        onChange={async (e) => {
          const files = e.target.files ? [...e.target.files] : []
          e.target.value = ''
          if (!files.length) return
          const page = currentPage()
          const assets = await importFiles(files)
          if (page) assets.forEach((a) => placeAsset(a))
          onDone()
        }}
      />
    </div>
  )
}
