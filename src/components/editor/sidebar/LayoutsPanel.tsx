import { useEffect, useMemo, useState } from 'react'
import { Save, Search, Trash2 } from 'lucide-react'
import type { Page } from '../../../types'
import { currentPage, useEditor } from '../../../store/editor'
import { CATEGORY_LABELS, formatShape, STARTER_TEMPLATES, TEMPLATE_META, TEMPLATES, type PanelTemplate, type TemplateCategory, type TemplateStyle } from '../../../lib/templates'
import { deleteLocalTemplate, listLocalTemplates, saveLocalTemplate, type LocalTemplate } from '../../../lib/storage'
import { scalePage } from '../../../lib/pageScale'
import { cx, Segmented, Slider } from '../../ui/controls'
import { confirmChoice, confirmDialog } from '../../ui/Confirm'

type Mode = 'replace' | 'new' | 'add'
type Count = 'all' | '1' | '2-3' | '4-5' | '6+'

const COUNTS: { id: Count; label: string; test: (n: number) => boolean }[] = [
  { id: 'all', label: 'Todas', test: () => true },
  { id: '1', label: '1', test: (n) => n === 1 },
  { id: '2-3', label: '2–3', test: (n) => n >= 2 && n <= 3 },
  { id: '4-5', label: '4–5', test: (n) => n >= 4 && n <= 5 },
  { id: '6+', label: '6+', test: (n) => n >= 6 },
]

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

/** Galería de plantillas: buscar, filtrar, aplicar de tres maneras y guardar páginas propias. */
export function LayoutsPanel() {
  const format = useEditor((s) => s.project!.format)
  const pageId = useEditor((s) => s.pageId)
  const [margin, setMargin] = useState(format.margin)
  const [gutter, setGutter] = useState(Math.round(format.width * 0.018))
  const [mode, setMode] = useState<Mode>('replace')
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<TemplateCategory | 'all'>('all')
  const [count, setCount] = useState<Count>('all')
  const [style, setStyle] = useState<TemplateStyle | 'all'>('all')
  const [fitsFormat, setFitsFormat] = useState(true)
  const [mine, setMine] = useState<LocalTemplate[]>([])
  const [naming, setNaming] = useState<string | null>(null)
  const shape = formatShape(format)
  const s = useEditor.getState()

  const refresh = () => void listLocalTemplates().then(setMine).catch(() => setMine([]))
  useEffect(refresh, [])

  const list = useMemo(() => {
    const q = normalize(query.trim())
    return TEMPLATES.filter((t) => {
      const meta = TEMPLATE_META[t.id]
      if (cat !== 'all' && !meta.categories.includes(cat)) return false
      if (!COUNTS.find((c) => c.id === count)!.test(t.polys.length)) return false
      if (style !== 'all' && meta.style !== style && meta.style !== 'neutral') return false
      if (fitsFormat && meta.shape !== shape) return false
      if (q && !normalize(`${t.name} ${meta.use} ${meta.categories.map((c) => CATEGORY_LABELS[c]).join(' ')}`).includes(q)) return false
      return true
    })
  }, [query, cat, count, style, fitsFormat, shape])

  /** Cuánto contenido hay en la página actual (para confirmar antes de reemplazar). */
  const content = () => {
    const page = currentPage()
    return { panels: page?.elements.filter((e) => e.type === 'panel').length ?? 0, others: page?.elements.filter((e) => e.type !== 'panel').length ?? 0 }
  }

  const apply = async (tpl: PanelTemplate) => {
    if (mode === 'new') return s.addPageFromTemplate(tpl.id, margin, gutter)
    if (mode === 'add') return s.applyTemplate(tpl.id, margin, gutter, 'add')
    const { panels } = content()
    if (panels > 0) {
      // Con contenido se pregunta, y se ofrece aplicarla en una página nueva para no tocar esta.
      const choice = await confirmChoice('Reemplazar viñetas', `Las ${panels} viñetas actuales se reemplazan por "${tpl.name}" (${tpl.polys.length} viñetas). Las imágenes encuadradas se pasan a las nuevas viñetas en orden. Globos, textos y dibujos no se tocan.`, { confirmLabel: 'Aplicar', altLabel: 'En página nueva' })
      if (choice === 'cancel') return
      if (choice === 'alt') return s.addPageFromTemplate(tpl.id, margin, gutter)
    }
    s.applyTemplate(tpl.id, margin, gutter, 'replace')
  }

  /** "Página libre": se quitan las viñetas (lo demás queda). */
  const applyFree = async () => {
    if (mode === 'new') return s.addPage(undefined, pageId)
    const { panels } = content()
    if (!panels) return
    const choice = await confirmChoice('Página libre', `Se quitan las ${panels} viñetas de esta página (globos, textos e imágenes libres quedan).`, { confirmLabel: 'Quitar viñetas', altLabel: 'En página nueva', danger: true })
    if (choice === 'cancel') return
    if (choice === 'alt') return s.addPage(undefined, pageId)
    s.mutate((d) => {
      const pg = d.pages.find((p) => p.id === pageId)
      if (pg) pg.elements = pg.elements.filter((e) => e.type !== 'panel')
    }, { urgent: true })
  }
  const [focus, setFocus] = useState<PanelTemplate | null>(null)

  const applyMine = async (t: LocalTemplate) => {
    const project = useEditor.getState().project!
    const page = scalePage(t.page, t.format, project.format)
    const target: 'replace' | 'new' = mode === 'replace' ? 'replace' : 'new'
    if (target === 'replace') {
      const { panels, others } = content()
      if (panels + others > 0 && !(await confirmDialog('Reemplazar página', `Todo lo que hay en esta página se reemplaza por la plantilla "${t.name}". Podés deshacerlo con Ctrl+Z.`, { confirmLabel: 'Reemplazar', danger: true }))) return
    }
    await s.applyPageTemplate(page, t.assets, target)
  }

  const saveMine = async (name: string) => {
    setNaming(null)
    const project = useEditor.getState().project
    const page = currentPage()
    if (!project || !page) return
    try {
      await saveLocalTemplate(project, page, name.trim() || page.name || 'Mi plantilla')
      s.toast('Plantilla guardada en este navegador', 'success')
      refresh()
    } catch (e) {
      console.error(e)
      s.toast('No se pudo guardar la plantilla. ¿El navegador se quedó sin espacio?', 'error')
    }
  }

  const removeMine = async (t: LocalTemplate) => {
    if (!(await confirmDialog('Eliminar plantilla', `"${t.name}" se borrará de este navegador. Las páginas donde ya la usaste no cambian.`, { confirmLabel: 'Eliminar', danger: true }))) return
    await deleteLocalTemplate(t)
    refresh()
  }

  const chip = (active: boolean) => cx('min-h-8 rounded-full px-2.5 text-[11px] transition-colors pointer-coarse:min-h-10', active ? 'bg-accent text-white' : 'bg-ink-900 text-ink-300 ring-1 ring-ink-700 hover:text-fg')

  return (
    <div className="space-y-4 p-3" key={pageId}>
      <div className="no-autoclose space-y-3 rounded-lg bg-ink-900 p-3 ring-1 ring-ink-700">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'replace', label: 'Reemplazar' },
            { value: 'new', label: 'Página nueva' },
            { value: 'add', label: 'Encima' },
          ]}
        />
        <Slider label="Margen de página" value={margin} min={0} max={Math.round(format.width * 0.15)} onChange={setMargin} format={(v) => `${v}px`} />
        <Slider label="Medianil (espacio entre viñetas)" value={gutter} min={0} max={Math.round(format.width * 0.08)} onChange={setGutter} format={(v) => `${v}px`} />
      </div>

      <section aria-labelledby="iniciales-titulo">
        <h4 id="iniciales-titulo" className="mb-2 text-[11px] font-semibold tracking-wider text-ink-400 uppercase">
          Plantillas iniciales
        </h4>
        <ul className="space-y-1.5">
          <li>
            <button
              onClick={async () => {
                if (mode === 'new') return s.applyCoverTemplate('new')
                const { panels, others } = content()
                if (panels + others > 0) {
                  const choice = await confirmChoice('Portada', 'Lo que hay en esta página se reemplaza por una portada (imagen a página completa, título, bajada y autor/a).', { confirmLabel: 'Reemplazar', altLabel: 'En página nueva', danger: true })
                  if (choice === 'cancel') return
                  if (choice === 'alt') return s.applyCoverTemplate('new')
                }
                s.applyCoverTemplate('replace')
              }}
              data-starter="portada"
              className="flex w-full items-center gap-3 rounded-lg bg-ink-900 p-2 text-left ring-1 ring-ink-700 transition-colors hover:ring-accent"
            >
              <span className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-sm bg-ink-700 p-1" style={{ width: 60 * Math.min(1, format.width / format.height), height: Math.min(90, 60 / (format.width / format.height)) }}>
                <span className="h-1.5 w-4/5 rounded bg-accent" />
                <span className="h-1 w-3/5 rounded bg-ink-400" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium text-fg">Portada</span>
                <span className="block text-[11px] leading-snug text-ink-400">Imagen a página completa con título, bajada y autor/a listos para editar.</span>
                <span className="block text-[10px] text-ink-400">1 imagen + 3 textos</span>
              </span>
            </button>
          </li>
          {STARTER_TEMPLATES.map((st) => {
            const tpl = st.id ? TEMPLATES.find((t) => t.id === st.id) : null
            return (
              <li key={st.name}>
                <button
                  onClick={() => void (tpl ? apply(tpl) : applyFree())}
                  data-starter={st.id ?? 'libre'}
                  className="flex w-full items-center gap-3 rounded-lg bg-ink-900 p-2 text-left ring-1 ring-ink-700 transition-colors hover:ring-accent"
                >
                  {tpl ? (
                    <TemplatePreview polys={tpl.polys} ratio={format.width / format.height} />
                  ) : (
                    <span className="flex shrink-0 items-center justify-center rounded-sm border border-dashed border-ink-500 text-[10px] text-ink-400" style={{ width: 60 * Math.min(1, format.width / format.height), height: Math.min(90, 60 / (format.width / format.height)) }}>
                      libre
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-fg">{st.name}</span>
                    <span className="block text-[11px] leading-snug text-ink-400">{st.use}</span>
                    <span className="block text-[10px] text-ink-400">{tpl ? `${tpl.polys.length} viñetas` : 'Sin viñetas'}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="no-autoclose space-y-2">
        <label className="flex items-center gap-2 rounded-lg bg-ink-900 px-2.5 ring-1 ring-ink-700 focus-within:ring-accent">
          <Search size={14} className="text-ink-400" aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar plantilla (acción, tira, diálogo…)" aria-label="Buscar plantilla" className="h-9 min-w-0 flex-1 bg-transparent text-xs text-fg outline-none" />
        </label>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Categoría">
          <button className={chip(cat === 'all')} aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
            Todas
          </button>
          {(Object.keys(CATEGORY_LABELS) as TemplateCategory[]).map((c) => (
            <button key={c} className={chip(cat === c)} aria-pressed={cat === c} onClick={() => setCat(c)}>
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Cantidad de viñetas">
          <span className="mr-1 text-[11px] text-ink-400">Viñetas:</span>
          {COUNTS.map((c) => (
            <button key={c.id} className={chip(count === c.id)} aria-pressed={count === c.id} onClick={() => setCount(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Estilo y formato">
          {(['all', 'manga', 'occidental'] as const).map((st) => (
            <button key={st} className={chip(style === st)} aria-pressed={style === st} onClick={() => setStyle(st)}>
              {st === 'all' ? 'Cualquier estilo' : st === 'manga' ? 'Manga (der → izq)' : 'Occidental'}
            </button>
          ))}
          <button className={chip(fitsFormat)} aria-pressed={fitsFormat} onClick={() => setFitsFormat(!fitsFormat)}>
            Para este formato
          </button>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-[11px] font-semibold tracking-wider text-ink-400 uppercase">
          Plantillas <span className="font-normal normal-case">({list.length})</span>
        </h4>
        {list.length === 0 ? (
          <p className="text-xs text-ink-400">No hay plantillas con esos filtros.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {list.map((t) => (
              <button
                key={t.id}
                onClick={() => void apply(t)}
                onMouseEnter={() => setFocus(t)}
                onFocus={() => setFocus(t)}
                title={TEMPLATE_META[t.id].use}
                aria-label={`${t.name}: ${t.polys.length} viñetas. ${TEMPLATE_META[t.id].use}`}
                data-template={t.id}
                className="group flex flex-col items-center gap-1"
              >
                <TemplatePreview polys={t.polys} ratio={format.width / format.height} />
                <span className="w-full truncate text-center text-[10px] text-ink-300 group-hover:text-fg">{t.name}</span>
              </button>
            ))}
          </div>
        )}
        {/* Antes de aplicar: nombre, cantidad de viñetas y para qué sirve la que está bajo el puntero o con foco. */}
        <p className="mt-2 min-h-8 rounded-md bg-ink-900 px-2 py-1.5 text-[11px] text-ink-300" aria-live="polite" data-testid="detalle-plantilla">
          {focus ? (
            <>
              <strong className="text-fg">{focus.name}</strong> · {focus.polys.length} viñetas · {TEMPLATE_META[focus.id].use}
            </>
          ) : (
            'Pasá el puntero por una plantilla para ver qué incluye.'
          )}
        </p>
      </div>

      <div>
        <h4 className="mb-2 text-[11px] font-semibold tracking-wider text-ink-400 uppercase">Mis plantillas</h4>
        {naming !== null ? (
          <form
            className="no-autoclose flex gap-1"
            onSubmit={(e) => {
              e.preventDefault()
              void saveMine(naming)
            }}
          >
            <input autoFocus value={naming} onChange={(e) => setNaming(e.target.value)} aria-label="Nombre de la plantilla" className="h-9 min-w-0 flex-1 rounded-lg border border-accent bg-ink-900 px-2 text-xs text-fg outline-none" />
            <button type="submit" className="h-9 rounded-lg bg-accent px-3 text-xs font-medium text-white">
              Guardar
            </button>
          </form>
        ) : (
          <button onClick={() => setNaming(currentPage()?.name ?? '')} className="no-autoclose flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-ink-600 py-2 text-xs text-ink-200 hover:border-accent hover:text-fg pointer-coarse:min-h-11">
            <Save size={14} /> Guardar esta página como plantilla
          </button>
        )}
        {mine.length > 0 && (
          <ul className="mt-2 grid grid-cols-3 gap-2">
            {mine.map((t) => (
              <li key={t.id} className="relative flex flex-col items-center gap-1">
                <button onClick={() => void applyMine(t)} aria-label={`Usar mi plantilla ${t.name}`} className="flex flex-col items-center gap-1">
                  <PagePreview page={t.page} ratio={t.format.width / t.format.height} />
                  <span className="w-full truncate text-center text-[10px] text-ink-300">{t.name}</span>
                </button>
                <button onClick={() => void removeMine(t)} aria-label={`Eliminar mi plantilla ${t.name}`} className="no-autoclose absolute top-0 right-0 flex size-7 items-center justify-center rounded-md bg-black/70 text-red-300 pointer-coarse:size-10">
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-[11px] leading-relaxed text-ink-500">Tip: con la herramienta Viñeta (P) podés dibujar viñetas a mano. Los cortes diagonales se ajustan con el tamaño de la viñeta.</p>
    </div>
  )
}

/** Miniatura del layout real de la plantilla. */
export function TemplatePreview({ polys, ratio }: { polys: PanelTemplate['polys']; ratio: number }) {
  const w = 60
  const h = Math.min(90, w / ratio)
  const vw = ratio >= 1 ? 100 : 100 * ratio
  const vh = ratio >= 1 ? 100 / ratio : 100
  const pad = 5
  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} width={ratio >= 1 ? w : h * ratio} height={ratio >= 1 ? w / ratio : h} className="rounded-sm bg-white ring-1 ring-ink-600 transition-shadow group-hover:ring-2 group-hover:ring-accent" aria-hidden="true">
      {polys.map((poly, i) => (
        <polygon key={i} points={poly.map((p) => `${pad + p.x * (vw - pad * 2)},${pad + p.y * (vh - pad * 2)}`).join(' ')} fill="#e7e5e4" stroke="#111" strokeWidth={1.6} style={{ transformOrigin: 'center', transformBox: 'fill-box', scale: '0.93' }} />
      ))}
    </svg>
  )
}

/** Miniatura de una página propia a partir de sus viñetas reales. */
function PagePreview({ page, ratio }: { page: Page; ratio: number }) {
  const W = 100
  const H = W / ratio
  const panels = page.elements.filter((e) => e.type === 'panel')
  const xs = page.elements.map((e) => e.x + e.width)
  const ys = page.elements.map((e) => e.y + e.height)
  const sw = Math.max(1, ...xs)
  const sh = Math.max(1, ...ys)
  const k = Math.min(W / sw, H / sh)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={60} height={60 / ratio} className="rounded-sm ring-1 ring-ink-600" style={{ background: page.background }} aria-hidden="true">
      {panels.map((p) => (
        <rect key={p.id} x={p.x * k} y={p.y * k} width={p.width * k} height={p.height * k} fill={p.type === 'panel' && p.image ? '#9ca3af' : '#e7e5e4'} stroke="#111" strokeWidth={1.2} />
      ))}
      {page.elements
        .filter((e) => e.type === 'bubble' || e.type === 'text')
        .map((e) => (
          <ellipse key={e.id} cx={(e.x + e.width / 2) * k} cy={(e.y + e.height / 2) * k} rx={(e.width / 2) * k} ry={(e.height / 2) * k} fill="#fff" stroke="#111" strokeWidth={0.8} />
        ))}
    </svg>
  )
}
