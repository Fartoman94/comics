import { useEffect, useRef, useState } from 'react'
import { ACCEPT_ATTR } from '../../../lib/imageValidation'
import { deleteWithConfirm } from '../actions'
import { ArrowDownToLine, ArrowUpToLine, Brush, Check, Copy, Crop, Eraser, FileText, Files, ImagePlus, Images, Layers, LayoutGrid, MessageCircle, Minus, MoreHorizontal, PenLine, Plus, Shapes, SlidersHorizontal, SquareDashed, Trash2, Type, Undo2 } from 'lucide-react'
import { openImagePicker } from '../images/ImagePicker'
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

type Group = 'pages' | 'design' | 'images' | 'text' | 'bubbles' | 'elements' | 'layers'
type Sheet = Group | 'props' | 'add' | 'script' | 'more' | null

const GROUP_TITLES: Record<Group, string> = {
  pages: 'Páginas',
  design: 'Viñetas y plantillas',
  images: 'Imágenes y biblioteca',
  text: 'Textos y onomatopeyas',
  bubbles: 'Globos',
  elements: 'Formas, efectos y dibujo',
  layers: 'Capas',
}

// Microayudas: aparecen la primera vez que se abre cada grupo.
const TIPS: Partial<Record<Group, string>> = {
  pages: 'Tocá una página para editarla. Para cambiar el orden arrastrá la manija o usá los botones de mover.',
  design: 'Tocá una plantilla para armar las viñetas de esta página, o dibujá una viñeta a mano.',
  images: 'Subí fotos o dibujos. Si tenés una viñeta seleccionada, la imagen que toques la rellena.',
  text: 'Elegí un texto o una onomatopeya: se inserta y podés escribir directamente.',
  bubbles: 'Tocá un tipo de globo y escribí. Arrastrá el punto naranja hacia el personaje.',
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
    if (request && (request.id === 'script' || request.id in GROUP_TITLES)) setSheet(request.id as Sheet)
  }, [request])
  const selection = useEditor((s) => s.selection)
  const tool = useEditor((s) => s.tool)
  const editing = useEditor((s) => !!s.editingTextId || !!s.croppingPanelId)
  const close = () => setSheet(null)
  const group = sheet && sheet in GROUP_TITLES ? (sheet as Group) : null
  // Imagen: con una viñeta seleccionada la llena; si no, se agrega a la página. Siempre por el selector (subir o galería).
  const addImage = () => {
    setSheet(null)
    const st = useEditor.getState()
    const el = currentPage()?.elements.find((e) => e.id === st.selection[0])
    if (st.selection.length === 1 && el?.type === 'panel') pickImageFor(el.id)
    else openImagePicker({ kind: 'insert' })
  }
  const drawing = tool === 'brush' || tool === 'eraser'

  return (
    <>
      {!sheet && !editing && (
        // Sobre el lienzo, justo encima de la barra inferior (sin taparla).
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-20 flex flex-col items-center gap-2 px-2 pb-2">
          {drawing ? <DrawingBar onSettings={() => setSheet('props')} /> : tool === 'panel' ? <PanelToolBar /> : selection.length > 0 ? <ContextBar onMore={() => setSheet('props')} /> : null}
        </div>
      )}

      <nav className="flex shrink-0 items-stretch border-t border-ink-700 bg-ink-900 pb-[env(safe-area-inset-bottom)]" aria-label="Herramientas">
        <BarButton label="Agregar" aria="Agregar contenido" active={sheet === 'add'} onClick={() => setSheet(sheet === 'add' ? null : 'add')} accent>
          <Plus size={22} />
        </BarButton>
        <BarButton label="Texto" active={sheet === 'text'} onClick={() => setSheet(sheet === 'text' ? null : 'text')}>
          <Type size={20} />
        </BarButton>
        <BarButton label="Globo" active={sheet === 'bubbles'} onClick={() => setSheet(sheet === 'bubbles' ? null : 'bubbles')}>
          <MessageCircle size={20} />
        </BarButton>
        <BarButton label="Imagen" onClick={addImage}>
          <ImagePlus size={20} />
        </BarButton>
        <BarButton label="Viñeta" active={sheet === 'design'} onClick={() => setSheet(sheet === 'design' ? null : 'design')}>
          <LayoutGrid size={20} />
        </BarButton>
        <BarButton label="Más" aria="Más herramientas" active={sheet === 'more'} onClick={() => setSheet(sheet === 'more' ? null : 'more')}>
          <MoreHorizontal size={20} />
        </BarButton>
      </nav>

      {group && (
        <BottomSheet title={GROUP_TITLES[group]} onClose={close} onBodyClick={(e) => autoClose(e, close, group)}>
          {TIPS[group] && <Tip id={`grupo-${group}`}>{TIPS[group]}</Tip>}
          {group === 'pages' && <PagesPanel />}
          {group === 'design' && (
            <>
              <div className="px-3 pt-3">
                <button onClick={() => useEditor.getState().setTool('panel')} className="flex min-h-12 w-full items-center gap-3 rounded-xl bg-ink-900 p-3 text-left ring-1 ring-ink-700 active:bg-ink-700">
                  <SquareDashed size={20} className="text-accent-bright" />
                  <span>
                    <span className="block text-sm font-medium text-fg">Dibujar viñeta a mano</span>
                    <span className="block text-[11px] text-ink-400">Arrastrá el dedo sobre la página</span>
                  </span>
                </button>
              </div>
              <LayoutsPanel />
            </>
          )}
          {group === 'images' && <AssetsPanel />}
          {group === 'text' && <InsertPanel sections={['texts', 'sfx']} editOnInsert />}
          {group === 'bubbles' && <InsertPanel sections={['bubbles']} editOnInsert />}
          {group === 'elements' && <InsertPanel sections={['shapes', 'effects', 'drawing']} />}
          {group === 'layers' && <LayersPanel />}
        </BottomSheet>
      )}
      {sheet === 'more' && (
        <BottomSheet title="Más herramientas" onClose={close}>
          <MoreMenu hasSelection={selection.length > 0} onOpen={(s2) => setSheet(s2)} />
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
  if (group === 'pages' || group === 'layers') return
  const btn = (e.target as HTMLElement).closest('button')
  if (btn && !btn.closest('.no-autoclose') && !btn.closest('[data-tip]')) setTimeout(close, 60)
}

function BarButton({ label, aria, onClick, children, active, accent }: { label: string; aria?: string; onClick: () => void; children: React.ReactNode; active?: boolean; accent?: boolean }) {
  return (
    <button onClick={onClick} aria-label={aria ?? label} aria-pressed={active} className={cx('flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px]', active ? 'text-accent-bright' : 'text-ink-200')}>
      <span className={cx(accent && 'flex size-8 items-center justify-center rounded-full bg-accent text-white')}>{children}</span>
      {label}
    </button>
  )
}

/** "Más": el resto de las herramientas del modo simple, cada una en su hoja. */
function MoreMenu({ hasSelection, onOpen }: { hasSelection: boolean; onOpen: (s: Sheet) => void }) {
  const items: { id: Sheet; label: string; desc: string; icon: React.ReactNode; hide?: boolean }[] = [
    { id: 'pages', label: 'Páginas', desc: 'Agregar, ordenar, duplicar', icon: <Files size={20} /> },
    { id: 'images', label: 'Imágenes', desc: 'Subidas y biblioteca', icon: <Images size={20} /> },
    { id: 'elements', label: 'Formas y efectos', desc: 'Símbolos, tramas, dibujo', icon: <Shapes size={20} /> },
    { id: 'layers', label: 'Capas', desc: 'Orden, ocultar, bloquear', icon: <Layers size={20} /> },
    { id: 'script', label: 'Guion', desc: 'Diálogos por viñeta', icon: <FileText size={20} /> },
    { id: 'props', label: 'Todas las opciones', desc: 'Propiedades de lo seleccionado', icon: <SlidersHorizontal size={20} />, hide: !hasSelection },
  ]
  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {items
        .filter((i) => !i.hide)
        .map((it) => (
          <button key={it.label} onClick={() => onOpen(it.id)} className="flex min-h-16 items-center gap-3 rounded-xl bg-ink-900 p-3 text-left ring-1 ring-ink-700 active:bg-ink-700">
            <span className="text-accent-bright">{it.icon}</span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-fg">{it.label}</span>
              <span className="block truncate text-[11px] text-ink-400">{it.desc}</span>
            </span>
          </button>
        ))}
    </div>
  )
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
  const del = <Action label="Eliminar" onClick={() => void deleteWithConfirm()} danger><Trash2 size={19} /></Action>
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
            <span className="block text-sm font-medium text-fg">{it.label}</span>
            <span className="block text-[11px] text-ink-400">{it.desc}</span>
          </span>
        </button>
      ))}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT_ATTR}
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
