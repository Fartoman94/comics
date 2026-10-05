import { useState } from 'react'
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  ChevronUp,
  Copy,
  Crop,
  Eye,
  EyeOff,
  FlipHorizontal2,
  FlipVertical2,
  ImagePlus,
  Lock,
  RotateCcw,
  RotateCw,
  SplitSquareHorizontal,
  SplitSquareVertical,
  Slash,
  Trash2,
  Unlock,
} from 'lucide-react'
import type { Page, BlendMode, BubbleElement, BubbleShape, ComicElement, DrawingElement, EffectElement, ImageElement, ImageFilters, PanelElement, ShapeElement, ShapeKind, TextElement, TextStyle } from '../../../types'
import { SHAPE_DEFS, shapeDef, shapeSvgPath } from '../../../lib/shapes'
import { bubbleHasTail, isBoxBubble } from '../../../lib/factories'
import { BUBBLES, BubbleIcon } from '../sidebar/InsertPanel'
import { DEFAULT_FILTERS } from '../../../types'
import { notifyLocked, useCurrentPage, useEditor, useSelectedElements } from '../../../store/editor'
import { FONTS, ensureGlyphs } from '../../../lib/fonts'
import { Button, ColorInput, cx, Field, IconButton, NumberInput, Section, Segmented, Select, Slider, TextArea, TextInput, Toggle } from '../../ui/controls'
import { MadeByMateLabs } from '../../ui/Brand'
import { pickImageFor, replaceImageFor } from '../CanvasStage'
import { coverCrop, detectShape, fitPanelImage, PANEL_SHAPES, shapeGeometry, type PanelShape } from '../../../lib/panelOps'
import { TYPE_LABEL } from '../../../lib/hierarchy'
import { deleteWithConfirm } from '../actions'

export function Inspector() {
  return (
    <aside data-tour="inspector" aria-label="Propiedades" className="scroll-thin hidden w-72 shrink-0 overflow-y-auto border-l border-ink-700 bg-ink-850 xl:block">
      <InspectorBody />
    </aside>
  )
}

export function InspectorBody() {
  const tool = useEditor((s) => s.tool)
  const selected = useSelectedElements()
  if (tool === 'brush' || tool === 'eraser') return <BrushPanel />
  if (selected.length === 0) return <PagePanel />
  if (selected.length > 1) return <MultiPanel els={selected} />
  return <ElementPanel el={selected[0]} />
}

type Patch<T> = (p: Partial<T>, coalesce?: string) => void

function usePatch<T extends ComicElement>(el: T): Patch<T> {
  return (p, coalesce) => useEditor.getState().updateElement(el.id, p as Partial<ComicElement>, coalesce ?? Object.keys(p).join(','))
}

// ---------- Página / proyecto ----------

function PagePanel() {
  const page = useCurrentPage()
  const project = useEditor((s) => s.project)!
  const mutate = useEditor((s) => s.mutate)
  if (!page) return null
  const setPage = (fn: (p: Page) => void, key: string) =>
    mutate(
      (d) => {
        const p = d.pages.find((x) => x.id === page.id)
        if (p) fn(p as Page)
      },
      { coalesce: key },
    )
  return (
    <>
      <Section title="Página">
        <Field label="Nombre">
          <TextInput value={page.name} onChange={(v) => setPage((p) => void (p.name = v), 'page-name')} className="max-w-40" />
        </Field>
        <Field label="Fondo" inline={false}>
          <ColorInput value={page.background} onChange={(v) => setPage((p) => void (p.background = v), 'page-bg')} swatches />
        </Field>
        <p className="text-[11px] text-ink-500">
          {project.format.name} · {project.format.width}×{project.format.height}px
        </p>
      </Section>
      <DesignSection />
      <Section title="Obra">
        <Field label="Autor/a">
          <TextInput value={project.author} onChange={(v) => mutate((d) => void (d.author = v), { coalesce: 'author' })} className="max-w-40" />
        </Field>
        <Field label="Sentido de lectura" inline={false}>
          <Segmented
            value={project.readingDirection}
            onChange={(v) => mutate((d) => void (d.readingDirection = v))}
            options={[
              { value: 'ltr', label: 'Izq → Der', title: 'Cómic occidental' },
              { value: 'rtl', label: 'Der → Izq', title: 'Manga' },
              { value: 'vertical', label: 'Vertical', title: 'Webtoon' },
            ]}
          />
        </Field>
        <Field label="Sinopsis" inline={false}>
          <TextArea label="Sinopsis" value={project.synopsis} rows={4} placeholder="¿De qué trata tu historia?" onChange={(v) => mutate((d) => void (d.synopsis = v), { coalesce: 'synopsis' })} />
        </Field>
      </Section>
      <Section title="Primeros pasos">
        <ul className="list-disc space-y-1.5 pl-4 text-[11px] leading-relaxed text-ink-400">
          <li>Elegí una plantilla en la pestaña Plantillas.</li>
          <li>Subí fotos o dibujos en Biblioteca y arrastralos a cada viñeta.</li>
          <li>Doble clic en una viñeta con imagen para encuadrarla; en una imagen libre, para recortarla.</li>
          <li>Agregá globos (G) y onomatopeyas desde Elementos.</li>
          <li>Pulsá Leer para ver cómo queda como libro.</li>
        </ul>
      </Section>
      <div className="flex justify-center p-4">
        <MadeByMateLabs size="sm" />
      </div>
    </>
  )
}

/**
 * Diseño: estilos (bordes, radio, tipografía) en bloque para la página o el proyecto. Las
 * plantillas (estructura de viñetas) están aparte, en la pestaña Plantillas.
 */
function DesignSection() {
  const [stroke, setStroke] = useState('#111111')
  const [width, setWidth] = useState(5)
  const [radius, setRadius] = useState(0)
  const [font, setFont] = useState('Comic Neue')
  const s = useEditor.getState()
  const both = (apply: (scope: 'page' | 'project') => void) => (
    <div className="grid grid-cols-2 gap-2">
      <Button size="sm" onClick={() => apply('page')}>
        A esta página
      </Button>
      <Button size="sm" variant="ghost" onClick={() => apply('project')}>
        A todo el proyecto
      </Button>
    </div>
  )
  return (
    <Section title="Diseño">
      <p className="text-[11px] text-ink-500">Estilo en bloque. La estructura de viñetas se cambia en Plantillas.</p>
      <div className="space-y-2 rounded-lg bg-ink-900 p-2.5 ring-1 ring-ink-700" role="group" aria-label="Bordes de viñetas">
        <div className="text-xs text-ink-300">Bordes de viñetas</div>
        <Slider label="Grosor" value={width} min={0} max={30} onChange={setWidth} format={(v) => `${v}px`} />
        <Slider label="Radio" value={radius} min={0} max={60} onChange={setRadius} format={(v) => `${v}px`} />
        <ColorInput value={stroke} onChange={setStroke} label="Color del borde de viñetas" />
        {both((scope) => s.applyDesign({ panelStroke: stroke, panelStrokeWidth: width, panelRadius: radius }, scope))}
      </div>
      <div className="space-y-2 rounded-lg bg-ink-900 p-2.5 ring-1 ring-ink-700" role="group" aria-label="Tipografía de globos">
        <div className="text-xs text-ink-300">Tipografía de globos</div>
        <select aria-label="Fuente de los globos" value={font} onChange={(e) => setFont(e.target.value)} className="h-8 w-full rounded-md border border-ink-600 bg-ink-900 px-2 text-xs text-ink-100" style={{ fontFamily: font }}>
          {FONTS.filter((f) => f.script === 'latin').map((f) => (
            <option key={f.family} value={f.family}>
              {f.label} — {f.use}
            </option>
          ))}
        </select>
        {both((scope) => s.applyDesign({ bubbleFont: font }, scope))}
      </div>
    </Section>
  )
}

// ---------- Pincel ----------

function BrushPanel() {
  const tool = useEditor((s) => s.tool)
  const brush = useEditor((s) => s.brush)
  const setBrush = useEditor((s) => s.setBrush)
  const page = useCurrentPage()
  const selection = useEditor((s) => s.selection)
  const layers = page?.elements.filter((e): e is DrawingElement => e.type === 'drawing') ?? []
  const target = layers.find((l) => selection.includes(l.id)) ?? [...layers].reverse().find((l) => !l.locked && !l.hidden)
  return (
    <>
      <Section title={tool === 'eraser' ? 'Borrador' : 'Pincel'}>
        {tool === 'brush' ? (
          <>
            <Segmented
              value={brush.kind}
              onChange={(kind) => setBrush({ kind })}
              options={[
                { value: 'ink', label: 'Tinta', title: 'Trazo con puntas afinadas' },
                { value: 'pen', label: 'Pluma' },
                { value: 'pencil', label: 'Lápiz' },
                { value: 'marker', label: 'Marcador' },
              ]}
            />
            <Slider label="Tamaño" value={brush.size} min={1} max={120} onChange={(size) => setBrush({ size })} format={(v) => `${v}px`} />
            <Slider label="Opacidad" value={brush.opacity} min={0.05} max={1} step={0.05} onChange={(opacity) => setBrush({ opacity })} format={(v) => `${Math.round(v * 100)}%`} />
            <Field label="Color" inline={false}>
              <ColorInput value={brush.color} onChange={(color) => setBrush({ color })} swatches />
            </Field>
            <BrushPreview color={brush.color} size={brush.size} opacity={brush.opacity} />
          </>
        ) : (
          <Slider label="Tamaño" value={brush.eraserSize} min={2} max={200} onChange={(eraserSize) => setBrush({ eraserSize })} format={(v) => `${v}px`} />
        )}
        <p className="text-[11px] text-ink-500">Tamaño rápido con [ y ]. Con lápiz óptico se usa la presión real.</p>
      </Section>
      <Section title="Capa de destino">
        {target ? (
          <p className="text-xs text-ink-200">
            Pintando en <strong className="text-fg">{target.name}</strong> ({target.strokes.length} trazos)
          </p>
        ) : (
          <p className="text-xs text-ink-400">Se creará una capa de dibujo nueva al primer trazo.</p>
        )}
        {layers.length > 1 && (
          <Select
            value={target?.id ?? ''}
            onChange={(id) => useEditor.getState().select([id])}
            options={layers.map((l) => ({ value: l.id, label: l.name }))}
          />
        )}
      </Section>
    </>
  )
}

function BrushPreview({ color, size, opacity }: { color: string; size: number; opacity: number }) {
  return (
    <svg viewBox="0 0 200 40" className="h-10 w-full rounded-md bg-white">
      <path d="M10 28 C 50 5, 90 38, 130 18 S 180 12, 190 20" fill="none" stroke={color} strokeOpacity={opacity} strokeWidth={Math.min(24, size)} strokeLinecap="round" />
    </svg>
  )
}

// ---------- Selección múltiple ----------

function MultiPanel({ els }: { els: ComicElement[] }) {
  const s = useEditor.getState()
  return (
    <>
      <Section title={`${els.length} elementos`}>
        <AlignButtons ids={els.map((e) => e.id)} />
        <div className="flex gap-2">
          <Button size="sm" onClick={s.duplicateSelection} className="flex-1">
            <Copy size={13} /> Duplicar
          </Button>
          <Button size="sm" variant="danger" onClick={() => void deleteWithConfirm()} className="flex-1">
            <Trash2 size={13} /> Eliminar
          </Button>
        </div>
      </Section>
      <ArrangeSection />
    </>
  )
}

function alignSelection(ids: string[], mode: 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom') {
  const s = useEditor.getState()
  const locked = s.project?.pages.find((p) => p.id === s.pageId)?.elements.filter((e) => ids.includes(e.id) && e.locked).length ?? 0
  if (locked) notifyLocked(locked)
  const { width: W, height: H } = s.project!.format
  s.mutate((d) => {
    const page = d.pages.find((p) => p.id === s.pageId)
    if (!page) return
    const els = page.elements.filter((e) => ids.includes(e.id) && !e.locked && !e.hidden)
    // Con un elemento se alinea a la página; con varios, entre ellos.
    const box =
      els.length === 1
        ? { x: 0, y: 0, r: W, b: H }
        : { x: Math.min(...els.map((e) => e.x)), y: Math.min(...els.map((e) => e.y)), r: Math.max(...els.map((e) => e.x + e.width)), b: Math.max(...els.map((e) => e.y + e.height)) }
    for (const e of els) {
      if (mode === 'left') e.x = box.x
      if (mode === 'right') e.x = box.r - e.width
      if (mode === 'hcenter') e.x = (box.x + box.r) / 2 - e.width / 2
      if (mode === 'top') e.y = box.y
      if (mode === 'bottom') e.y = box.b - e.height
      if (mode === 'vcenter') e.y = (box.y + box.b) / 2 - e.height / 2
    }
  })
}

function AlignButtons({ ids }: { ids: string[] }) {
  const modes = [
    ['left', <AlignStartVertical size={15} key="1" />, 'Alinear a la izquierda'],
    ['hcenter', <AlignCenterVertical size={15} key="2" />, 'Centrar horizontal'],
    ['right', <AlignEndVertical size={15} key="3" />, 'Alinear a la derecha'],
    ['top', <AlignStartHorizontal size={15} key="4" />, 'Alinear arriba'],
    ['vcenter', <AlignCenterHorizontal size={15} key="5" />, 'Centrar vertical'],
    ['bottom', <AlignEndHorizontal size={15} key="6" />, 'Alinear abajo'],
  ] as const
  return (
    <div className="flex justify-between rounded-md bg-ink-900 p-0.5 ring-1 ring-ink-700">
      {modes.map(([m, icon, label]) => (
        <IconButton key={m} label={label} onClick={() => alignSelection(ids, m)}>
          {icon}
        </IconButton>
      ))}
    </div>
  )
}

function ArrangeSection() {
  const s = useEditor.getState()
  return (
    <Section title="Orden">
      <div className="grid grid-cols-4 gap-1">
        <IconButton label="Traer al frente (Ctrl+Shift+])" onClick={() => s.arrange('front')} className="w-full">
          <ArrowUpToLine size={15} />
        </IconButton>
        <IconButton label="Subir (Ctrl+])" onClick={() => s.arrange('forward')} className="w-full">
          <ChevronUp size={15} />
        </IconButton>
        <IconButton label="Bajar (Ctrl+[)" onClick={() => s.arrange('backward')} className="w-full">
          <ChevronDown size={15} />
        </IconButton>
        <IconButton label="Enviar al fondo (Ctrl+Shift+[)" onClick={() => s.arrange('back')} className="w-full">
          <ArrowDownToLine size={15} />
        </IconButton>
      </div>
    </Section>
  )
}

// ---------- Elemento ----------


const BLEND_OPTIONS: { value: BlendMode; label: string }[] = [
  { value: 'source-over', label: 'Normal' },
  { value: 'multiply', label: 'Multiplicar (tinta sobre color)' },
  { value: 'screen', label: 'Trama (aclarar)' },
  { value: 'overlay', label: 'Superponer' },
  { value: 'soft-light', label: 'Luz suave' },
  { value: 'hard-light', label: 'Luz fuerte' },
  { value: 'darken', label: 'Oscurecer' },
  { value: 'lighten', label: 'Aclarar' },
  { value: 'color-dodge', label: 'Sobreexponer color' },
  { value: 'color-burn', label: 'Subexponer color' },
  { value: 'difference', label: 'Diferencia' },
  { value: 'luminosity', label: 'Luminosidad' },
]

function ElementPanel({ el }: { el: ComicElement }) {
  const patch = usePatch(el)
  const s = useEditor.getState()
  return (
    <>
      <div className="flex items-center justify-between border-b border-ink-700 px-4 py-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold tracking-wider text-accent-bright uppercase">{TYPE_LABEL[el.type]}</div>
          <div className="truncate text-sm font-medium text-fg">{el.name}</div>
        </div>
        <div className="flex">
          <IconButton label={el.hidden ? 'Mostrar' : 'Ocultar'} onClick={() => patch({ hidden: !el.hidden })} active={el.hidden}>
            {el.hidden ? <EyeOff size={15} /> : <Eye size={15} />}
          </IconButton>
          <IconButton label={el.locked ? 'Desbloquear' : 'Bloquear'} onClick={() => patch({ locked: !el.locked })} active={el.locked}>
            {el.locked ? <Lock size={15} /> : <Unlock size={15} />}
          </IconButton>
          <IconButton label="Duplicar (Ctrl+D)" onClick={s.duplicateSelection}>
            <Copy size={15} />
          </IconButton>
          <IconButton label="Eliminar (Supr)" onClick={() => void deleteWithConfirm()} className="hover:text-red-300">
            <Trash2 size={15} />
          </IconButton>
        </div>
      </div>

      {el.hidden && <p className="border-b border-ink-700 bg-amber-950/40 px-4 py-2 text-[11px] text-amber-200">Oculto: no se ve en la página ni se exporta. Mostralo con el ojo.</p>}
      {el.type === 'panel' && <PanelProps el={el} />}
      {el.type === 'image' && <ImageProps el={el} />}
      {el.type === 'bubble' && <BubbleProps el={el} />}
      {el.type === 'text' && <TextProps el={el} />}
      {el.type === 'effect' && <EffectProps el={el} />}
      {el.type === 'drawing' && <DrawingProps el={el} />}
      {el.type === 'shape' && <ShapeProps el={el} />}

      <Section title="Posición y tamaño">
        <div className="grid grid-cols-2 gap-2">
          <Field label="X">
            <NumberInput value={el.x} onChange={(x) => patch({ x })} />
          </Field>
          <Field label="Y">
            <NumberInput value={el.y} onChange={(y) => patch({ y })} />
          </Field>
          <Field label="An">
            <NumberInput value={el.width} min={8} onChange={(width) => patch({ width })} />
          </Field>
          <Field label="Al">
            <NumberInput value={el.height} min={8} onChange={(height) => patch({ height })} />
          </Field>
          <Field label="Giro">
            <NumberInput value={el.rotation} step={1} suffix="°" onChange={(rotation) => patch({ rotation })} />
          </Field>
        </div>
        <AlignButtons ids={[el.id]} />
      </Section>

      <Section title="Apariencia">
        <Slider label="Opacidad" value={el.opacity} min={0} max={1} step={0.01} onChange={(opacity) => patch({ opacity }, 'opacity')} format={(v) => `${Math.round(v * 100)}%`} />
        <Field label="Fusión" inline={false}>
          <Select value={el.blend ?? 'source-over'} onChange={(blend) => patch({ blend })} options={BLEND_OPTIONS} />
        </Field>
      </Section>
      <ArrangeSection />
    </>
  )
}

function PanelProps({ el }: { el: PanelElement }) {
  const patch = usePatch(el)
  const s = useEditor.getState()
  const asset = useEditor((st) => (el.image ? st.project?.assets.find((a) => a.id === el.image!.assetId) : undefined))
  const setFilters = (f: Partial<ImageFilters>) => s.updateElement(el.id, (d) => void (d.type === 'panel' && d.image && Object.assign(d.image.filters, f)), 'panel-filter')
  const shape = detectShape(el)
  const fit = (mode: 'cover' | 'contain') => asset && el.image && patch({ image: fitPanelImage(el, asset, mode, el.image) })
  const setImage = (p: Partial<NonNullable<PanelElement['image']>>) => s.updateElement(el.id, (d) => void (d.type === 'panel' && d.image && Object.assign(d.image, p)))
  // Al girar 90° se vuelve a llenar el marco con la imagen en su nueva orientación.
  const turnImage = (deg: number) => {
    if (!el.image) return
    const rotation = ((((el.image.rotation ?? 0) + deg) % 360) + 360) % 360
    const next = { ...el.image, rotation }
    patch({ image: asset ? fitPanelImage(el, asset, 'cover', next) : next })
  }
  const resetImage = () => asset && el.image && patch({ image: fitPanelImage(el, asset, 'cover', { ...el.image, rotation: 0, flipX: false, flipY: false }) })
  return (
    <>
      <Section title="Imagen">
        {el.image ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" onClick={() => s.setCropping(el.id)} title="Mover y acercar la imagen dentro del marco (doble clic)">
                <Crop size={13} /> Encuadrar
              </Button>
              <Button size="sm" onClick={() => pickImageFor(el.id)} title="Subir otra imagen para esta viñeta">
                <ImagePlus size={13} /> Reemplazar
              </Button>
              <Button size="sm" onClick={() => fit('cover')} disabled={!asset} title="La imagen llena todo el marco (puede recortarse)">
                Rellenar
              </Button>
              <Button size="sm" onClick={() => fit('contain')} disabled={!asset} title="La imagen se ve entera dentro del marco">
                Ajustar
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              <IconButton label="Girar la imagen 90° a la izquierda" className="w-full" onClick={() => turnImage(-90)}>
                <RotateCcw size={14} />
              </IconButton>
              <IconButton label="Girar la imagen 90° a la derecha" className="w-full" onClick={() => turnImage(90)}>
                <RotateCw size={14} />
              </IconButton>
              <IconButton label="Espejo horizontal de la imagen" className="w-full" active={!!el.image.flipX} onClick={() => setImage({ flipX: !el.image!.flipX })}>
                <FlipHorizontal2 size={14} />
              </IconButton>
              <IconButton label="Espejo vertical de la imagen" className="w-full" active={!!el.image.flipY} onClick={() => setImage({ flipY: !el.image!.flipY })}>
                <FlipVertical2 size={14} />
              </IconButton>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="ghost" disabled={!asset} onClick={resetImage} title="Sin giro ni espejos y llenando el marco">
                Restablecer
              </Button>
              <Button size="sm" variant="ghost" onClick={() => patch({ image: null })}>
                Quitar imagen
              </Button>
            </div>
            <FilterControls filters={el.image.filters} onChange={setFilters} />
          </>
        ) : (
          <Button size="sm" variant="primary" className="w-full" onClick={() => pickImageFor(el.id)}>
            <ImagePlus size={13} /> Subir imagen o foto
          </Button>
        )}
      </Section>
      <Section title="Fondo y borde">
        <Field label="Fondo" inline={false}>
          <ColorInput value={el.fill} onChange={(fill) => patch({ fill }, 'fill')} />
        </Field>
        <Slider label="Grosor del borde" value={el.strokeWidth} min={0} max={30} onChange={(strokeWidth) => patch({ strokeWidth }, 'sw')} format={(v) => `${v}px`} />
        <Field label="Color del borde" inline={false}>
          <ColorInput value={el.stroke} onChange={(stroke) => patch({ stroke }, 'stroke')} swatches />
        </Field>
        {!el.points && <Slider label="Radio de las esquinas" value={el.cornerRadius} min={0} max={80} onChange={(cornerRadius) => patch({ cornerRadius }, 'cr')} format={(v) => `${v}px`} />}
        <Slider label="Margen interior (imagen)" value={el.padding ?? 0} min={0} max={80} onChange={(padding) => patch({ padding }, 'pad')} format={(v) => `${v}px`} />
      </Section>
      <Section title="Forma">
        <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Forma de la viñeta">
          {PANEL_SHAPES.map((sh) => (
            <button
              key={sh.id}
              role="radio"
              aria-checked={shape === sh.id}
              onClick={() => patch(shapeGeometry(sh.id as PanelShape, el.width))}
              className={cx('flex flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[10px] ring-1 transition-colors', shape === sh.id ? 'bg-accent-soft text-fg ring-accent' : 'text-ink-300 ring-ink-700 hover:bg-ink-800 hover:text-fg')}
            >
              <ShapeIcon shape={sh.id} />
              {sh.label}
            </button>
          ))}
        </div>
        {shape === null && <p className="text-[11px] text-ink-500">Forma propia (de una plantilla o una división en diagonal).</p>}
      </Section>
      <Section title="Dividir">
        <div className="grid grid-cols-3 gap-1">
          <Button size="sm" onClick={() => s.splitPanel(el.id, 'horizontal')} title="Una arriba y otra abajo">
            <SplitSquareVertical size={13} /> Horiz.
          </Button>
          <Button size="sm" onClick={() => s.splitPanel(el.id, 'vertical')} title="Una a la izquierda y otra a la derecha">
            <SplitSquareHorizontal size={13} /> Vert.
          </Button>
          <Button size="sm" onClick={() => s.splitPanel(el.id, 'diagonal')} title="Corte inclinado, estilo manga">
            <Slash size={13} /> Diag.
          </Button>
        </div>
        <p className="text-[11px] text-ink-500">Deja el medianil entre las dos partes. La imagen queda en la primera.</p>
      </Section>
      <Section title="Escena">
        <Button size="sm" className="w-full" onClick={() => s.duplicatePanelWithContent(el.id)}>
          Duplicar viñeta con su contenido
        </Button>
      </Section>
    </>
  )
}

function ShapeIcon({ shape }: { shape: PanelShape }) {
  const pts = shapeGeometry(shape, 100)
  const poly = pts.points ?? [0, 0, 1, 0, 1, 1, 0, 1]
  return (
    <svg viewBox="-2 -2 28 22" className="h-4 w-6" aria-hidden>
      {shape === 'rounded' ? (
        <rect x={0} y={0} width={24} height={18} rx={5} fill="none" stroke="currentColor" strokeWidth={2} />
      ) : (
        <polygon points={poly.map((v, i) => (i % 2 ? v * 18 : v * 24)).join(' ')} fill="none" stroke="currentColor" strokeWidth={2} />
      )}
    </svg>
  )
}

function FilterControls({ filters, onChange }: { filters: ImageFilters; onChange: (f: Partial<ImageFilters>) => void }) {
  const f = { ...DEFAULT_FILTERS, ...filters }
  const presets: { label: string; f: Partial<ImageFilters> }[] = [
    { label: 'Original', f: DEFAULT_FILTERS },
    { label: 'Manga B/N', f: { ...DEFAULT_FILTERS, grayscale: true, contrast: 35 } },
    { label: 'Tinta', f: { ...DEFAULT_FILTERS, grayscale: true, threshold: 0.5 } },
    { label: 'Sepia', f: { ...DEFAULT_FILTERS, sepia: true, contrast: 10 } },
    { label: 'Noir', f: { ...DEFAULT_FILTERS, grayscale: true, contrast: 70, brightness: -0.1 } },
    { label: 'Sueño', f: { ...DEFAULT_FILTERS, blur: 4, brightness: 0.1 } },
  ]
  return (
    <div className="space-y-2.5 rounded-lg bg-ink-900 p-2.5 ring-1 ring-ink-700">
      <div className="grid grid-cols-3 gap-1">
        {presets.map((p) => (
          <button key={p.label} onClick={() => onChange(p.f)} className="rounded-md bg-ink-800 px-1 py-1.5 text-[10px] text-ink-200 hover:bg-ink-700 hover:text-fg">
            {p.label}
          </button>
        ))}
      </div>
      <Slider label="Brillo" value={f.brightness} min={-0.8} max={0.8} step={0.02} onChange={(brightness) => onChange({ brightness })} />
      <Slider label="Contraste" value={f.contrast} min={-80} max={100} onChange={(contrast) => onChange({ contrast })} />
      <Slider label="Tinta (umbral)" value={f.threshold} min={0} max={1} step={0.02} onChange={(threshold) => onChange({ threshold })} format={(v) => (v ? v.toFixed(2) : 'No')} />
      <Slider label="Desenfoque" value={f.blur} min={0} max={20} onChange={(blur) => onChange({ blur })} />
      <div className="grid grid-cols-3 gap-2">
        <Toggle label="B/N" checked={f.grayscale} onChange={(grayscale) => onChange({ grayscale })} />
        <Toggle label="Sepia" checked={f.sepia} onChange={(sepia) => onChange({ sepia })} />
        <Toggle label="Inv." checked={f.invert} onChange={(invert) => onChange({ invert })} />
      </div>
    </div>
  )
}

function ImageProps({ el }: { el: ImageElement }) {
  const patch = usePatch(el)
  const s = useEditor.getState()
  const asset = useEditor((st) => st.project?.assets.find((a) => a.id === el.assetId))
  const rotate = (deg: number) => patch({ rotation: (((el.rotation + deg) % 360) + 540) % 360 - 180 })
  return (
    <Section title="Imagen">
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" onClick={() => replaceImageFor(el.id)} title="Subir otra imagen en el mismo lugar">
          <ImagePlus size={13} /> Reemplazar
        </Button>
        <Button size="sm" onClick={() => s.setCropping(el.id)} title="Recortar (doble clic)">
          <Crop size={13} /> Recortar
        </Button>
        <Button
          size="sm"
          disabled={!asset}
          title="La caja toma la proporción de la imagen: se ve entera"
          onClick={() => {
            if (!asset) return
            const w = el.crop?.width ?? asset.width
            const h = el.crop?.height ?? asset.height
            patch({ height: (el.width * h) / w })
          }}
        >
          Ajustar
        </Button>
        <Button size="sm" disabled={!asset} title="La imagen llena la caja recortando lo que sobra" onClick={() => asset && patch({ crop: coverCrop(asset, el.width, el.height) })}>
          Rellenar
        </Button>
        <Button size="sm" onClick={() => rotate(-90)} title="Girar 90° a la izquierda" aria-label="Girar 90° a la izquierda">
          <RotateCcw size={13} /> 90°
        </Button>
        <Button size="sm" onClick={() => rotate(90)} title="Girar 90° a la derecha" aria-label="Girar 90° a la derecha">
          <RotateCw size={13} /> 90°
        </Button>
        <Button size="sm" onClick={() => patch({ flipX: !el.flipX })} title="Voltear horizontal">
          <FlipHorizontal2 size={13} /> Espejo H
        </Button>
        <Button size="sm" onClick={() => patch({ flipY: !el.flipY })} title="Voltear vertical">
          <FlipVertical2 size={13} /> Espejo V
        </Button>
      </div>
      {el.crop && (
        <Button size="sm" variant="ghost" className="w-full" onClick={() => patch({ crop: null })}>
          Quitar recorte
        </Button>
      )}
      <FilterControls filters={el.filters} onChange={(f) => s.updateElement(el.id, (d) => void (d.type === 'image' && Object.assign(d.filters, f)), 'img-filter')} />
      <p className="text-[11px] leading-relaxed text-ink-500">Para superponer imágenes, ordenalas con los botones de Orden y probá los modos de Fusión (Multiplicar para tinta sobre color, Trama para luces).</p>
    </Section>
  )
}

function TextStyleControls<T extends TextElement | BubbleElement>({ el, patch }: { el: T; patch: Patch<TextStyle> }) {
  const bold = el.fontStyle.includes('bold')
  const italic = el.fontStyle.includes('italic')
  const style = (b: boolean, i: boolean) => (b && i ? 'bold italic' : b ? 'bold' : i ? 'italic' : 'normal') as TextStyle['fontStyle']
  const groups = [
    { label: 'Latino', script: 'latin' },
    { label: 'Japonés', script: 'ja' },
    { label: 'Coreano', script: 'ko' },
    { label: 'Chino', script: 'zh' },
  ]
  return (
    <>
      <TextArea
        label="Texto"
        value={el.text}
        rows={3}
        onChange={(text) => {
          patch({ text }, 'text')
          ensureGlyphs(el.fontFamily, text)
        }}
      />
      <Field label="Fuente" inline={false}>
        <select
          className="h-8 w-full cursor-pointer rounded-md border border-ink-600 bg-ink-900 px-2 text-xs text-ink-100 outline-none focus:border-accent"
          value={el.fontFamily}
          onChange={(e) => {
            patch({ fontFamily: e.target.value })
            ensureGlyphs(e.target.value, el.text)
          }}
          style={{ fontFamily: el.fontFamily }}
        >
          {groups.map((g) => (
            <optgroup key={g.script} label={g.label}>
              {FONTS.filter((f) => f.script === g.script).map((f) => (
                <option key={f.family} value={f.family}>
                  {f.label} — {f.use}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Tamaño">
          <NumberInput value={el.fontSize} min={4} max={600} onChange={(fontSize) => patch({ fontSize })} />
        </Field>
        <Field label="Interl.">
          <NumberInput value={el.lineHeight} min={0.6} max={3} step={0.05} onChange={(lineHeight) => patch({ lineHeight })} />
        </Field>
        <Field label="Espac.">
          <NumberInput value={el.letterSpacing} min={-20} max={80} onChange={(letterSpacing) => patch({ letterSpacing })} />
        </Field>
      </div>
      <div>
        <Segmented
          value={el.align}
          onChange={(align) => patch({ align })}
          options={[
            { value: 'left', label: el.vertical ? 'Arr' : 'Izq' },
            { value: 'center', label: 'Centro' },
            { value: 'right', label: el.vertical ? 'Abj' : 'Der' },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <Toggle label="Negrita" checked={bold} onChange={(b) => patch({ fontStyle: style(b, italic) })} />
        <Toggle label="Cursiva" checked={italic} onChange={(i) => patch({ fontStyle: style(bold, i) })} />
        <Toggle label="Mayúsculas" checked={el.uppercase} onChange={(uppercase) => patch({ uppercase })} />
        <Toggle label="Vertical 縦" checked={!!el.vertical} onChange={(vertical) => patch({ vertical })} />
      </div>
      <Field label="Color del texto" inline={false}>
        <ColorInput value={el.textColor} onChange={(textColor) => patch({ textColor }, 'tc')} swatches />
      </Field>
    </>
  )
}

function BubbleProps({ el }: { el: BubbleElement }) {
  const patch = usePatch(el)
  const box = isBoxBubble(el.shape)
  const setShape = (shape: BubbleShape) => {
    // Cambiar de forma conserva texto y estilo; "sin borde" apaga el contorno y las cajas lo vuelven a tener.
    const extra: Partial<BubbleElement> = {}
    if (shape === 'borderless') extra.strokeWidth = 0
    else if (el.shape === 'borderless' && el.strokeWidth === 0) extra.strokeWidth = 3
    if (isBoxBubble(shape) && el.cornerRadius === undefined && shape === 'rounded-box') extra.cornerRadius = 18
    if (!bubbleHasTail(shape)) extra.tail = false
    patch({ shape, ...extra })
  }
  return (
    <>
      <Section title="Globo">
        <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Tipo de globo">
          {BUBBLES.map((b) => (
            <button
              key={b.shape}
              role="radio"
              aria-checked={el.shape === b.shape}
              onClick={() => setShape(b.shape)}
              className={cx('flex flex-col items-center gap-0.5 rounded-md px-1 py-1 text-[10px] ring-1 transition-colors', el.shape === b.shape ? 'bg-accent-soft text-fg ring-accent' : 'text-ink-300 ring-ink-700 hover:bg-ink-800')}
            >
              <BubbleIcon b={b} className="h-6 w-7" />
              {b.label}
            </button>
          ))}
        </div>
        {bubbleHasTail(el.shape) && (
          <>
            <Toggle label="Cola (arrastrá el punto naranja hacia el personaje)" checked={el.tail} onChange={(tail) => patch({ tail })} />
            {el.tail && <Slider label="Ancho de la cola" value={el.tailWidth ?? 1} min={0.4} max={2.5} step={0.05} onChange={(tailWidth) => patch({ tailWidth }, 'tw')} format={(v) => `${Math.round(v * 100)}%`} />}
          </>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Fondo" inline={false}>
            <ColorInput value={el.fill} onChange={(fill) => patch({ fill }, 'fill')} />
          </Field>
          {el.shape !== 'borderless' && (
            <Field label="Borde" inline={false}>
              <ColorInput value={el.stroke} onChange={(stroke) => patch({ stroke }, 'stroke')} />
            </Field>
          )}
        </div>
        {el.shape !== 'borderless' && <Slider label="Grosor del borde" value={el.strokeWidth} min={0} max={14} step={0.5} onChange={(strokeWidth) => patch({ strokeWidth }, 'sw')} />}
        <Slider label="Margen interior" value={el.padding} min={0} max={80} onChange={(padding) => patch({ padding }, 'pad')} />
        <Button size="sm" variant="ghost" className="w-full" onClick={() => useEditor.getState().fitBubbleToText(el.id)} title="Agranda o achica el globo para que el texto entre cómodo">
          Ajustar globo al texto
        </Button>
        {box && <Slider label="Radio de las esquinas" value={el.cornerRadius ?? 0} min={0} max={60} onChange={(cornerRadius) => patch({ cornerRadius }, 'cr')} format={(v) => `${v}px`} />}
      </Section>
      <Section title="Texto">
        <TextStyleControls el={el} patch={patch as Patch<TextStyle>} />
      </Section>
    </>
  )
}

function TextProps({ el }: { el: TextElement }) {
  const patch = usePatch(el)
  return (
    <>
      <Section title="Texto">
        <TextStyleControls el={el} patch={patch as Patch<TextStyle>} />
      </Section>
      <Section title="Efecto de letra">
        <Slider label="Contorno" value={el.strokeWidth} min={0} max={30} onChange={(strokeWidth) => patch({ strokeWidth }, 'sw')} />
        {el.strokeWidth > 0 && (
          <Field label="Color del contorno" inline={false}>
            <ColorInput value={el.stroke} onChange={(stroke) => patch({ stroke }, 'stroke')} />
          </Field>
        )}
        <Slider label="Inclinación" value={el.skewX} min={-0.6} max={0.6} step={0.02} onChange={(skewX) => patch({ skewX }, 'skew')} />
        <Toggle label="Sombra sólida" checked={el.shadow} onChange={(shadow) => patch({ shadow })} />
        {el.shadow && (
          <Field label="Color de sombra" inline={false}>
            <ColorInput value={el.shadowColor} onChange={(shadowColor) => patch({ shadowColor }, 'shc')} />
          </Field>
        )}
      </Section>
    </>
  )
}

function EffectProps({ el }: { el: EffectElement }) {
  const patch = usePatch(el)
  const tone = el.kind === 'screentone' || el.kind === 'gradient-tone'
  return (
    <Section title="Efecto">
      <Field label="Tipo" inline={false}>
        <Select
          value={el.kind}
          onChange={(kind) => patch({ kind })}
          options={[
            { value: 'focuslines', label: 'Líneas de impacto' },
            { value: 'speedlines', label: 'Líneas de velocidad' },
            { value: 'screentone', label: 'Trama de puntos' },
            { value: 'gradient-tone', label: 'Trama degradada' },
          ]}
        />
      </Field>
      <Field label="Color" inline={false}>
        <ColorInput value={el.color} onChange={(color) => patch({ color }, 'color')} swatches />
      </Field>
      {tone ? (
        <>
          <Slider label="Separación" value={el.density} min={3} max={40} step={0.5} onChange={(density) => patch({ density }, 'density')} />
          <Slider label="Tamaño del punto" value={el.dotSize} min={0.5} max={30} step={0.1} onChange={(dotSize) => patch({ dotSize }, 'dot')} />
        </>
      ) : (
        <>
          <Slider label="Cantidad de líneas" value={el.density} min={8} max={400} onChange={(density) => patch({ density }, 'density')} />
          <Slider label="Grosor" value={el.lineWidth} min={0.5} max={20} step={0.5} onChange={(lineWidth) => patch({ lineWidth }, 'lw')} />
          {el.kind === 'focuslines' && <Slider label="Centro libre" value={el.innerRadius} min={0} max={1} step={0.01} onChange={(innerRadius) => patch({ innerRadius }, 'ir')} />}
          {el.kind === 'speedlines' && <Slider label="Ángulo" value={el.angle} min={-180} max={180} onChange={(angle) => patch({ angle }, 'angle')} format={(v) => `${v}°`} />}
          <Button size="sm" variant="ghost" className="w-full" onClick={() => patch({ seed: Math.floor(Math.random() * 1e9) })}>
            Variar trazo
          </Button>
        </>
      )}
    </Section>
  )
}

function ShapeProps({ el }: { el: ShapeElement }) {
  const patch = usePatch(el)
  const def = shapeDef(el.shape)
  return (
    <Section title="Forma">
      <div className="grid grid-cols-5 gap-1" role="radiogroup" aria-label="Tipo de forma">
        {SHAPE_DEFS.map((d) => (
          <button
            key={d.id}
            role="radio"
            aria-checked={el.shape === d.id}
            aria-label={d.label}
            title={d.label}
            onClick={() => patch({ shape: d.id as ShapeKind })}
            className={cx('flex aspect-square items-center justify-center rounded-md ring-1', el.shape === d.id ? 'bg-accent-soft ring-accent' : 'ring-ink-700 hover:bg-ink-800')}
          >
            <svg viewBox="-2 -2 28 28" className="size-5" aria-hidden>
              <path d={shapeSvgPath(d.cmds)} fill={d.mode === 'fill' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={d.mode === 'fill' ? 0 : 2.4} strokeLinecap="round" className="text-ink-200" />
            </svg>
          </button>
        ))}
      </div>
      {def.mode === 'fill' && (
        <Field label="Relleno" inline={false}>
          <ColorInput value={el.fill} onChange={(fill) => patch({ fill }, 'fill')} swatches />
        </Field>
      )}
      <Field label={def.mode === 'fill' ? 'Contorno' : 'Color'} inline={false}>
        <ColorInput value={el.stroke} onChange={(stroke) => patch({ stroke }, 'stroke')} swatches={def.mode === 'stroke'} />
      </Field>
      <Slider label={def.mode === 'fill' ? 'Grosor del contorno' : 'Grosor del trazo'} value={el.strokeWidth} min={def.mode === 'fill' ? 0 : 1} max={40} onChange={(strokeWidth) => patch({ strokeWidth }, 'sw')} format={(v) => `${v}px`} />
    </Section>
  )
}

function DrawingProps({ el }: { el: DrawingElement }) {
  const patch = usePatch(el)
  const s = useEditor.getState()
  return (
    <Section title="Capa de dibujo">
      <p className="text-xs text-ink-300">{el.strokes.length} trazos</p>
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" onClick={() => s.setTool('brush')}>
          Pincel
        </Button>
        <Button size="sm" onClick={() => s.setTool('eraser')}>
          Borrador
        </Button>
        <Button size="sm" variant="ghost" disabled={!el.strokes.length} onClick={() => patch({ strokes: el.strokes.slice(0, -1) })}>
          Quitar último trazo
        </Button>
        <Button size="sm" variant="danger" disabled={!el.strokes.length} onClick={() => patch({ strokes: [] })}>
          Vaciar capa
        </Button>
      </div>
    </Section>
  )
}
