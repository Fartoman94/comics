import { useMemo, useRef, useState } from 'react'
import { BookOpen, FilePlus2, LayoutGrid, Sparkles, Zap } from 'lucide-react'
import type { Project, ReadingDirection } from '../../types'
import { getFormat, PAGE_FORMATS } from '../../lib/formats'
import { createProject } from '../../lib/factories'
import { createExampleProject } from '../../lib/examples'
import { duplicateProject, saveProject } from '../../lib/storage'
import { navigateToProject } from '../../lib/nav'
import { formatShape, TEMPLATE_META, TEMPLATES } from '../../lib/templates'
import { useEditor } from '../../store/editor'
import { Button, cx, Modal, NumberInput } from '../ui/controls'

type KindChoice = 'comic' | 'manga' | 'webtoon' | 'storyboard' | 'tira' | 'libre'
type Start = 'blank' | 'template' | 'example'

/**
 * "¿Qué querés crear?": cada tipo preconfigura formato (dimensiones y orientación), sentido de
 * lectura, plantilla y layouts sugeridos, y dice qué exportación conviene al terminar.
 */
export const KINDS: { id: KindChoice; name: string; use: string; kind: Project['kind']; format: string; dir: ReadingDirection; pages: number; template: string; layouts: string[]; exportHint: string }[] = [
  { id: 'comic', name: 'Cómic', use: 'Historieta occidental: se lee de izquierda a derecha.', kind: 'comic', format: 'us-comic', dir: 'ltr', pages: 4, template: 'classic-6', layouts: ['classic-6', 'hero-top', 'mixed-5'], exportHint: 'PDF de imprenta o liviano' },
  { id: 'manga', name: 'Manga', use: 'Estilo japonés: se lee de derecha a izquierda.', kind: 'manga', format: 'manga-tankobon', dir: 'rtl', pages: 4, template: 'manga-dynamic', layouts: ['manga-dynamic', 'manga-vertical', 'manga-4koma'], exportHint: 'PDF con lectura der → izq' },
  { id: 'webtoon', name: 'Webtoon', use: 'Tira vertical larga para leer en el celular.', kind: 'webtoon', format: 'webtoon', dir: 'vertical', pages: 3, template: 'webtoon-stack', layouts: ['webtoon-stack', 'splash'], exportHint: 'Webtoon en segmentos JPG' },
  { id: 'storyboard', name: 'Storyboard', use: 'Planos de cine, animación o video, con notas.', kind: 'libre', format: 'storyboard', dir: 'ltr', pages: 4, template: 'storyboard-6', layouts: ['storyboard-6', 'strip-3'], exportHint: 'PDF liviano para compartir' },
  { id: 'tira', name: 'Tira cómica', use: 'Tira horizontal de 3 o 4 viñetas para diario o redes.', kind: 'libre', format: 'strip', dir: 'ltr', pages: 2, template: 'strip-3', layouts: ['strip-3', 'strip-4'], exportHint: 'PNG o JPG por página' },
  { id: 'libre', name: 'Libre', use: 'Ilustraciones, pósters o lo que quieras.', kind: 'libre', format: 'square', dir: 'ltr', pages: 2, template: 'grid-2x2', layouts: ['grid-2x2', 'splash'], exportHint: 'PNG para redes' },
]

const LAST_KEY = 'vineta:ultimo-proyecto'
interface Last {
  kind: KindChoice
  start: Start
  template?: string
}
const readLast = (): Last | null => {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_KEY) ?? 'null') as Last | null
    return v && KINDS.some((k) => k.id === v.kind) ? v : null
  } catch {
    return null
  }
}

/** Proyecto nuevo en tres pasos: qué vas a crear, cómo empezar y datos opcionales. */
export function NewProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Recordamos la última elección sin imponerla: arranca preseleccionada y se cambia con un toque.
  const [last] = useState(readLast)
  const [step, setStep] = useState(1)
  const [choice, setChoice] = useState<KindChoice>(last?.kind ?? 'comic')
  const [start, setStart] = useState<Start>(last?.start ?? 'template')
  const def = KINDS.find((k) => k.id === choice)!
  const [templateId, setTemplateId] = useState(last?.template ?? def.template)
  const [title, setTitle] = useState('Mi primera historia')
  const [author, setAuthor] = useState('')
  const [formatId, setFormatId] = useState(def.format)
  const [dir, setDir] = useState<ReadingDirection>(def.dir)
  const [pages, setPages] = useState(def.pages)
  const format = getFormat(formatId)
  const shape = formatShape(format)
  // Sugeridas para el tipo elegido primero, después el resto que entra en el formato.
  const templates = useMemo(() => {
    const fit = TEMPLATES.filter((t) => TEMPLATE_META[t.id].shape === shape)
    const rank = (id: string) => {
      const i = def.layouts.indexOf(id)
      return i < 0 ? 99 : i
    }
    return [...fit].sort((a, b) => rank(a.id) - rank(b.id))
  }, [shape, def.layouts])

  const pickKind = (k: KindChoice) => {
    const d = KINDS.find((x) => x.id === k)!
    setChoice(k)
    setFormatId(d.format)
    setDir(d.dir)
    setPages(d.pages)
    setTemplateId(d.template)
  }

  // Un solo proyecto por pedido, aunque haya doble clic, Enter repetido o IndexedDB lento.
  const [creating, setCreating] = useState(false)
  const busy = useRef(false)
  const create = async (quick = false) => {
    if (busy.current) return
    busy.current = true
    setCreating(true)
    const d = KINDS.find((x) => x.id === choice)!
    const opts = quick
      ? { title: title.trim() || 'Mi primera historia', author: '', kind: d.kind, formatId: d.format, pages: d.pages, templateId: d.template, readingDirection: d.dir }
      : { title: title.trim() || 'Sin título', author: author.trim(), kind: d.kind, formatId, pages, templateId: start === 'blank' ? null : start === 'template' ? templateId : undefined, readingDirection: dir }
    try {
      let id: string
      if (!quick && start === 'example' && choice === 'manga') {
        // El ejemplo de manga es la obra de muestra completa, como copia propia y editable.
        const { buildDemoProject } = await import('../../demo/demoProject')
        const demo = await buildDemoProject()
        id = (await duplicateProject(demo, { title: opts.title })).id
      } else {
        const p = !quick && start === 'example' ? createExampleProject(opts) : createProject(opts)
        await saveProject(p)
        id = p.id
      }
      try {
        localStorage.setItem(LAST_KEY, JSON.stringify({ kind: choice, start: quick ? 'template' : start, template: templateId } satisfies Last))
      } catch {
        /* sin almacenamiento */
      }
      onClose()
      navigateToProject(id)
    } catch (e) {
      console.error(e)
      useEditor.getState().toast('No se pudo crear el proyecto. ¿El navegador se quedó sin espacio?', 'error', { label: 'Reintentar', run: () => void create(quick) })
    } finally {
      busy.current = false
      setCreating(false)
    }
  }

  const card = (active: boolean) => cx('rounded-xl border p-3 text-left transition-colors', active ? 'border-accent bg-accent-soft' : 'border-ink-600 hover:border-ink-400')

  return (
    <Modal open={open} onClose={onClose} title="Nuevo proyecto" width="max-w-2xl">
      <div className="p-5">
        <ol className="mb-4 flex items-center gap-2 text-[11px] text-ink-400" aria-label="Pasos">
          {['Qué vas a crear', 'Cómo empezar', 'Datos'].map((t, i) => (
            <li key={t} className={cx('flex items-center gap-1.5', step === i + 1 && 'text-white')} aria-current={step === i + 1 ? 'step' : undefined}>
              <span className={cx('flex size-5 items-center justify-center rounded-full text-[10px] font-semibold', step === i + 1 ? 'bg-accent text-white' : 'bg-ink-700')}>{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>

        {step === 1 && <h3 className="font-comic mb-3 text-2xl tracking-wide text-white">¿Qué querés crear?</h3>}
        {step === 1 && (
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de obra">
            {KINDS.map((k) => {
              const f = getFormat(k.format)
              return (
                <button key={k.id} role="radio" aria-checked={choice === k.id} onClick={() => pickKind(k.id)} className={cx(card(choice === k.id), 'flex items-center gap-3')}>
                  <FormatBox w={f.width} h={f.height} size={44} />
                  <span className="min-w-0">
                    <span className="font-comic block text-xl tracking-wide text-white">{k.name}</span>
                    <span className="block text-[11px] leading-snug text-ink-300">{k.use}</span>
                    <span className="block text-[10px] text-ink-400">
                      {f.name} · {f.width > f.height ? 'horizontal' : 'vertical'} · {k.dir === 'rtl' ? 'der → izq' : k.dir === 'vertical' ? 'scroll vertical' : 'izq → der'}
                    </span>
                    <span className="block text-[10px] text-ink-300">Exportar: {k.exportHint}</span>
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Cómo empezar">
              {(
                [
                  ['blank', 'En blanco', 'Páginas vacías para armar a tu manera.', <FilePlus2 key="b" size={18} />],
                  ['template', 'Con plantilla', 'Las viñetas ya armadas en cada página.', <LayoutGrid key="t" size={18} />],
                  ['example', 'Ejemplo editable', choice === 'manga' ? 'El manga de muestra completo, para tocarlo.' : 'Viñetas, globos y guion de ejemplo.', <Sparkles key="e" size={18} />],
                ] as const
              ).map(([id, name, desc, icon]) => (
                <button key={id} role="radio" aria-checked={start === id} onClick={() => setStart(id)} className={card(start === id)}>
                  <span className="flex items-center gap-2 text-sm font-medium text-white">
                    <span className="text-accent-bright">{icon}</span>
                    {name}
                  </span>
                  <span className="mt-1 block text-[11px] text-ink-300">{desc}</span>
                </button>
              ))}
            </div>
            {start === 'template' && (
              <div>
                <div className="mb-2 text-xs text-ink-300">Plantilla para las páginas</div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Plantilla">
                  {templates.map((t) => (
                    <button key={t.id} role="radio" aria-checked={templateId === t.id} title={TEMPLATE_META[t.id].use} onClick={() => setTemplateId(t.id)} className={cx('flex flex-col items-center gap-1 rounded-lg p-1', templateId === t.id ? 'bg-accent-soft ring-2 ring-accent' : 'hover:bg-ink-800')}>
                      <TemplateMini polys={t.polys} w={format.width} h={format.height} />
                      <span className="w-full truncate text-center text-[10px] text-ink-300">{t.name}</span>
                      {def.layouts.includes(t.id) && <span className="text-[9px] text-accent-bright">sugerida</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-ink-300">
                  Título
                  <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 text-sm text-white outline-none focus:border-accent" />
                </label>
                <label className="text-xs text-ink-300">
                  Autor/a
                  <input value={author} placeholder="Tu nombre" onChange={(e) => setAuthor(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 text-sm text-white outline-none focus:border-accent" />
                </label>
              </div>
              <div>
                <div className="mb-2 text-xs text-ink-300">Formato de página <span className="text-ink-500">(recomendado: {getFormat(def.format).name})</span></div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PAGE_FORMATS.map((f) => (
                    <button key={f.id} onClick={() => setFormatId(f.id)} aria-pressed={formatId === f.id} className={cx('rounded-lg border px-3 py-2 text-left transition-colors', formatId === f.id ? 'border-accent bg-accent-soft' : 'border-ink-600 hover:border-ink-400')}>
                      <div className="text-xs font-medium text-white">{f.name}</div>
                      <div className="text-[10px] text-ink-400">{f.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-ink-300">
                  Sentido de lectura
                  <select value={dir} onChange={(e) => setDir(e.target.value as ReadingDirection)} className="h-9 rounded-lg border border-ink-600 bg-ink-900 px-2 text-xs text-white">
                    <option value="ltr">Izquierda → derecha{def.dir === 'ltr' ? ' (recomendado)' : ''}</option>
                    <option value="rtl">Derecha → izquierda{def.dir === 'rtl' ? ' (recomendado)' : ''}</option>
                    <option value="vertical">Vertical{def.dir === 'vertical' ? ' (recomendado)' : ''}</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-xs text-ink-300">
                  Páginas
                  <NumberInput value={pages} onChange={setPages} min={1} max={60} className="w-20" />
                </label>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl bg-ink-900 p-4">
              <FormatBox w={format.width} h={format.height} size={140} label />
              <div className="mt-3 text-center text-xs text-ink-300">{format.name}</div>
              <div className="text-[10px] text-ink-500">{dir === 'rtl' ? 'Lectura derecha → izquierda' : dir === 'vertical' ? 'Lectura vertical' : 'Lectura izquierda → derecha'}</div>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-700 px-5 py-3.5">
        {step === 1 ? (
          <Button variant="ghost" onClick={() => void create(true)} disabled={creating} title="Crea el proyecto con los valores recomendados">
            <Zap size={15} /> Crear rápido
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={creating}>
            Atrás
          </Button>
        )}
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          {step < 3 ? (
            <Button variant="primary" onClick={() => setStep(step + 1)}>
              Siguiente
            </Button>
          ) : (
            <Button variant="primary" onClick={() => void create()} disabled={creating} aria-busy={creating}>
              <BookOpen size={15} /> {creating ? 'Creando…' : 'Crear proyecto'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

/** Rectángulo con la proporción real del formato. */
function FormatBox({ w, h, size, label }: { w: number; h: number; size: number; label?: boolean }) {
  const horizontal = w > h
  return (
    <div className="flex shrink-0 items-center justify-center bg-white text-[10px] font-semibold text-ink-700 shadow-lg" style={{ width: horizontal ? size : (size * w) / h, height: horizontal ? (size * h) / w : size }} aria-hidden="true">
      {label ? `${w}×${h}` : null}
    </div>
  )
}

/** Miniatura de la plantilla con la proporción del formato elegido. */
function TemplateMini({ polys, w, h }: { polys: (typeof TEMPLATES)[number]['polys']; w: number; h: number }) {
  const vw = 100
  const vh = (100 * h) / w
  const box = 48
  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} width={w > h ? box : (box * w) / h} height={w > h ? (box * h) / w : box} className="rounded-sm bg-white" aria-hidden="true">
      {polys.map((poly, i) => (
        <polygon key={i} points={poly.map((p) => `${4 + p.x * (vw - 8)},${4 + p.y * (vh - 8)}`).join(' ')} fill="#e7e5e4" stroke="#111" strokeWidth={vw / 50} />
      ))}
    </svg>
  )
}
