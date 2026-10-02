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
  FlipHorizontal2,
  FlipVertical2,
  ImagePlus,
  Lock,
  Trash2,
  Unlock,
} from 'lucide-react'
import type { Page, BlendMode, BubbleElement, BubbleShape, ComicElement, DrawingElement, EffectElement, ImageElement, ImageFilters, PanelElement, TextElement, TextStyle } from '../../../types'
import { DEFAULT_FILTERS } from '../../../types'
import { notifyLocked, useCurrentPage, useEditor, useSelectedElements } from '../../../store/editor'
import { FONTS, ensureGlyphs } from '../../../lib/fonts'
import { Button, ColorInput, Field, IconButton, NumberInput, Section, Segmented, Select, Slider, TextArea, TextInput, Toggle } from '../../ui/controls'
import { MadeByMateLabs } from '../../ui/Brand'
import { pickImageFor } from '../CanvasStage'

export function Inspector() {
  return (
    <aside data-tour="inspector" className="scroll-thin hidden w-72 shrink-0 overflow-y-auto border-l border-ink-700 bg-ink-850 xl:block">
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
          <TextArea value={project.synopsis} rows={4} placeholder="¿De qué trata tu historia?" onChange={(v) => mutate((d) => void (d.synopsis = v), { coalesce: 'synopsis' })} />
        </Field>
      </Section>
      <Section title="Primeros pasos">
        <ul className="list-disc space-y-1.5 pl-4 text-[11px] leading-relaxed text-ink-400">
          <li>Elegí una plantilla en la pestaña Viñetas.</li>
          <li>Subí fotos o dibujos en Imágenes y arrastralos a cada viñeta.</li>
          <li>Doble clic en una viñeta con imagen para encuadrarla; en una imagen libre, para recortarla.</li>
          <li>Agregá globos (G) y onomatopeyas desde Insertar.</li>
          <li>Pulsá Leer para ver cómo queda como libro.</li>
        </ul>
      </Section>
      <div className="flex justify-center p-4">
        <MadeByMateLabs size="sm" />
      </div>
    </>
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
            Pintando en <strong className="text-white">{target.name}</strong> ({target.strokes.length} trazos)
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
          <Button size="sm" variant="danger" onClick={s.deleteSelection} className="flex-1">
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

const TYPE_LABEL: Record<ComicElement['type'], string> = {
  panel: 'Viñeta',
  image: 'Imagen',
  bubble: 'Globo',
  text: 'Texto',
  effect: 'Efecto',
  drawing: 'Capa de dibujo',
}

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
          <div className="text-[10px] font-semibold tracking-wider text-accent uppercase">{TYPE_LABEL[el.type]}</div>
          <div className="truncate text-sm font-medium text-white">{el.name}</div>
        </div>
        <div className="flex">
          <IconButton label={el.locked ? 'Desbloquear' : 'Bloquear'} onClick={() => patch({ locked: !el.locked })} active={el.locked}>
            {el.locked ? <Lock size={15} /> : <Unlock size={15} />}
          </IconButton>
          <IconButton label="Duplicar (Ctrl+D)" onClick={s.duplicateSelection}>
            <Copy size={15} />
          </IconButton>
          <IconButton label="Eliminar (Supr)" onClick={s.deleteSelection} className="hover:text-red-300">
            <Trash2 size={15} />
          </IconButton>
        </div>
      </div>

      {el.type === 'panel' && <PanelProps el={el} />}
      {el.type === 'image' && <ImageProps el={el} />}
      {el.type === 'bubble' && <BubbleProps el={el} />}
      {el.type === 'text' && <TextProps el={el} />}
      {el.type === 'effect' && <EffectProps el={el} />}
      {el.type === 'drawing' && <DrawingProps el={el} />}

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
  const setFilters = (f: Partial<ImageFilters>) => s.updateElement(el.id, (d) => void (d.type === 'panel' && d.image && Object.assign(d.image.filters, f)), 'panel-filter')
  return (
    <>
      <Section title="Escena">
        <Button size="sm" className="w-full" onClick={() => s.duplicatePanelWithContent(el.id)}>
          Duplicar viñeta con su contenido
        </Button>
      </Section>
      <Section title="Imagen de la viñeta">
        {el.image ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" onClick={() => s.setCropping(el.id)}>
                <Crop size={13} /> Encuadrar
              </Button>
              <Button size="sm" onClick={() => pickImageFor(el.id)}>
                <ImagePlus size={13} /> Cambiar
              </Button>
            </div>
            <Button size="sm" variant="ghost" className="w-full" onClick={() => patch({ image: null })}>
              Quitar imagen
            </Button>
            <FilterControls filters={el.image.filters} onChange={setFilters} />
          </>
        ) : (
          <Button size="sm" variant="primary" className="w-full" onClick={() => pickImageFor(el.id)}>
            <ImagePlus size={13} /> Subir imagen o foto
          </Button>
        )}
      </Section>
      <Section title="Borde y fondo">
        <Slider label="Grosor del borde" value={el.strokeWidth} min={0} max={30} onChange={(strokeWidth) => patch({ strokeWidth }, 'sw')} format={(v) => `${v}px`} />
        <Field label="Color del borde" inline={false}>
          <ColorInput value={el.stroke} onChange={(stroke) => patch({ stroke }, 'stroke')} swatches />
        </Field>
        <Field label="Fondo" inline={false}>
          <ColorInput value={el.fill} onChange={(fill) => patch({ fill }, 'fill')} />
        </Field>
        {!el.points && <Slider label="Esquinas redondeadas" value={el.cornerRadius} min={0} max={80} onChange={(cornerRadius) => patch({ cornerRadius }, 'cr')} format={(v) => `${v}px`} />}
        {el.points && (
          <Button size="sm" variant="ghost" className="w-full" onClick={() => patch({ points: null })}>
            Convertir en rectángulo
          </Button>
        )}
      </Section>
    </>
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
          <button key={p.label} onClick={() => onChange(p.f)} className="rounded-md bg-ink-800 px-1 py-1.5 text-[10px] text-ink-200 hover:bg-ink-700 hover:text-white">
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
  return (
    <Section title="Imagen">
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" onClick={() => s.setCropping(el.id)}>
          <Crop size={13} /> Recortar
        </Button>
        <Button
          size="sm"
          onClick={() => {
            if (!asset) return
            const w = el.crop?.width ?? asset.width
            const h = el.crop?.height ?? asset.height
            patch({ height: (el.width * h) / w })
          }}
        >
          Proporción original
        </Button>
        <Button size="sm" onClick={() => patch({ flipX: !el.flipX })}>
          <FlipHorizontal2 size={13} /> Espejo H
        </Button>
        <Button size="sm" onClick={() => patch({ flipY: !el.flipY })}>
          <FlipVertical2 size={13} /> Espejo V
        </Button>
      </div>
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

const SHAPES: { value: BubbleShape; label: string }[] = [
  { value: 'speech', label: 'Diálogo' },
  { value: 'thought', label: 'Pensamiento' },
  { value: 'shout', label: 'Grito' },
  { value: 'whisper', label: 'Susurro' },
  { value: 'box', label: 'Narración' },
  { value: 'cloud-box', label: 'Recuadro nube' },
]

function BubbleProps({ el }: { el: BubbleElement }) {
  const patch = usePatch(el)
  return (
    <>
      <Section title="Globo">
        <Field label="Forma" inline={false}>
          <Select value={el.shape} onChange={(shape) => patch({ shape })} options={SHAPES} />
        </Field>
        {el.shape !== 'box' && el.shape !== 'cloud-box' && <Toggle label="Cola (arrastrá el punto naranja)" checked={el.tail} onChange={(tail) => patch({ tail })} />}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Fondo" inline={false}>
            <ColorInput value={el.fill} onChange={(fill) => patch({ fill }, 'fill')} />
          </Field>
          <Field label="Borde" inline={false}>
            <ColorInput value={el.stroke} onChange={(stroke) => patch({ stroke }, 'stroke')} />
          </Field>
        </div>
        <Slider label="Grosor del borde" value={el.strokeWidth} min={0} max={14} step={0.5} onChange={(strokeWidth) => patch({ strokeWidth }, 'sw')} />
        <Slider label="Margen interior" value={el.padding} min={0} max={80} onChange={(padding) => patch({ padding }, 'pad')} />
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
