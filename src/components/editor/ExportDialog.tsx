import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, BookOpen, Check, Download, Eye, FileArchive, FileImage, FileText, Package, Printer, ScrollText } from 'lucide-react'
import { currentPage, useEditor } from '../../store/editor'
import { ExportCancelled, ExportError, exportPagePNG, exportPDF, exportProject, exportWebtoon, exportZIP, webtoonPlan, type ExportResult, type WebtoonOptions } from '../../lib/export'
import { bytesPerPixel, formatBytes } from '../../lib/exportPlan'
import { downloadBlob } from '../../lib/storage'
import { Button, cx, Modal, Segmented, Slider } from '../ui/controls'

type Preset = 'pantalla' | 'webbook' | 'imprenta' | 'webtoon' | 'zip' | 'png' | 'editable'
type Phase = { kind: 'choose' } | { kind: 'running'; done: number; total: number } | { kind: 'done'; result: ExportResult } | { kind: 'error'; message: string }

const PRESET_KEY = (kind: string) => `vineta:ultimo-preset:${kind}`

/** Exportar: presets explicados, resumen antes de empezar, progreso cancelable y lista final. */
export function ExportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const project = useEditor((s) => s.project)!
  const vertical = project.kind === 'webtoon' || project.readingDirection === 'vertical'
  const { width: W, height: H } = project.format
  const n = project.pages.length
  const [preset, setPreset] = useState<Preset | null>(null)
  const [phase, setPhase] = useState<Phase>({ kind: 'choose' })
  const [wt, setWt] = useState<WebtoonOptions>({ format: 'jpg', quality: 0.9, targetWidth: Math.min(W, 800), mode: 'slices', sliceMaxHeight: 1280 * 4, from: 1, to: n })
  const abort = useRef<AbortController | null>(null)
  const urls = useRef<string[]>([])

  // Se recuerda el último preset por tipo de obra.
  useEffect(() => {
    if (!open) return
    try {
      setPreset((localStorage.getItem(PRESET_KEY(project.kind)) as Preset | null) ?? (vertical ? 'webtoon' : 'pantalla'))
    } catch {
      setPreset(vertical ? 'webtoon' : 'pantalla')
    }
    setPhase({ kind: 'choose' })
  }, [open, project.kind, vertical])

  // Al cerrar se liberan las vistas previas y se cancela lo que esté corriendo.
  const close = () => {
    abort.current?.abort()
    urls.current.forEach((u) => URL.revokeObjectURL(u))
    urls.current = []
    onClose()
  }

  const presets: { id: Preset; icon: React.ReactNode; title: string; detail: string; use: string }[] = [
    { id: 'pantalla', icon: <FileText size={20} />, title: 'Pantalla (PDF liviano)', detail: `PDF · ${W}×${H} px · JPEG 82 %`, use: 'Para leer en la compu o el celular y compartir por mensaje.' },
    { id: 'webbook', icon: <BookOpen size={20} />, title: 'Libro web (.html)', detail: 'Un solo archivo, funciona sin internet', use: 'Para publicar o compartir con el visor de páginas que se dan vuelta.' },
    { id: 'imprenta', icon: <Printer size={20} />, title: 'Imprenta (PDF)', detail: `PDF · ${W * 2}×${H * 2} px · JPEG 92 %`, use: 'Doble resolución para imprimir.' },
    { id: 'webtoon', icon: <ScrollText size={20} />, title: 'Webtoon', detail: 'JPG o PNG · tira, páginas o segmentos numerados', use: 'Para plataformas de webtoon: segmenta solo si la tira es muy larga.' },
    { id: 'zip', icon: <FileArchive size={20} />, title: 'Páginas en PNG (ZIP)', detail: `${n} PNG · ${W * 2}×${H * 2} px`, use: 'Un archivo por página, numerados para subir a plataformas.' },
    { id: 'png', icon: <FileImage size={20} />, title: 'Esta página en PNG', detail: `PNG · ${W * 2}×${H * 2} px`, use: 'La página actual en alta calidad, sin guías.' },
    { id: 'editable', icon: <Package size={20} />, title: 'Archivo editable (.vineta)', detail: 'Proyecto completo con imágenes', use: 'Copia de seguridad; se abre desde «Importar».' },
  ]

  const plan = useMemo(() => (preset === 'webtoon' ? webtoonPlan(project, wt) : null), [preset, project, wt])

  /** Resumen previo: cuántos archivos, de qué tamaño y cuánto pesan aproximadamente. */
  const summary = useMemo(() => {
    const px = (r: number) => W * r * H * r
    switch (preset) {
      case 'pantalla':
        return { files: 1, dims: `${n} páginas de ${W}×${H}`, bytes: px(1) * n * bytesPerPixel('jpg', 0.82) }
      case 'imprenta':
        return { files: 1, dims: `${n} páginas de ${W * 2}×${H * 2}`, bytes: px(2) * n * bytesPerPixel('jpg', 0.92) }
      case 'webbook':
        return { files: 1, dims: `${n} páginas`, bytes: px(Math.min(2, 2000 / H)) * n * bytesPerPixel('jpg', 0.86) * 1.37 }
      case 'zip':
        return { files: n, dims: `${W * 2}×${H * 2} cada una`, bytes: px(2) * n * bytesPerPixel('png', 1) }
      case 'png':
        return { files: 1, dims: `${W * 2}×${H * 2}`, bytes: px(2) * bytesPerPixel('png', 1) }
      case 'webtoon':
        return plan ? { files: plan.files.length, dims: plan.files.length === 1 ? `${plan.files[0].width}×${plan.files[0].height}` : `${plan.files[0].width} px de ancho, hasta ${Math.max(...plan.files.map((f) => f.height))} px de alto`, bytes: plan.estimatedBytes } : null
      default:
        return null
    }
  }, [preset, plan, W, H, n])

  const run = async () => {
    if (!preset) return
    try {
      localStorage.setItem(PRESET_KEY(project.kind), preset)
    } catch {
      /* sin almacenamiento */
    }
    const ctrl = new AbortController()
    abort.current = ctrl
    setPhase({ kind: 'running', done: 0, total: n })
    // Foto del proyecto: exportar nunca lo modifica ni toca el historial.
    const p = structuredClone(useEditor.getState().project!)
    const ctx = { signal: ctrl.signal, onProgress: (done: number, total: number) => setPhase({ kind: 'running', done, total }) }
    try {
      let result: ExportResult
      if (preset === 'pantalla') result = await exportPDF(p, 'web', ctx)
      else if (preset === 'imprenta') result = await exportPDF(p, 'print', ctx)
      else if (preset === 'webbook') result = await (await import('../../lib/webbook')).exportWebBook(p, ctx)
      else if (preset === 'zip') result = await exportZIP(p, ctx)
      else if (preset === 'png') result = await exportPagePNG(p, currentPage()!, 2)
      else if (preset === 'webtoon') result = await exportWebtoon(p, wt, ctx)
      else result = await exportProject(p)
      if (ctrl.signal.aborted) throw new ExportCancelled()
      downloadBlob(result.download.blob, result.download.name)
      setPhase({ kind: 'done', result })
    } catch (e) {
      if (e instanceof ExportCancelled) {
        setPhase({ kind: 'choose' })
        useEditor.getState().toast('Exportación cancelada')
      } else {
        console.error(e)
        setPhase({ kind: 'error', message: e instanceof ExportError ? e.message : 'No se pudo exportar. Probá de nuevo o con otro formato.' })
      }
    } finally {
      abort.current = null
    }
  }

  const preview = (blob: Blob) => {
    const u = URL.createObjectURL(blob)
    urls.current.push(u)
    window.open(u, '_blank', 'noopener')
  }

  const running = phase.kind === 'running'
  return (
    <Modal open={open} onClose={() => !running && close()} title="Exportar" width="max-w-xl">
      {phase.kind === 'done' ? (
        <div className="space-y-3 p-4" data-testid="exportacion-lista">
          <p className="flex items-center gap-2 text-sm text-emerald-300">
            <Check size={16} /> Listo. Se descargó «{phase.result.download.name}».
          </p>
          <ul className="max-h-60 divide-y divide-ink-700 overflow-y-auto rounded-lg bg-ink-900 ring-1 ring-ink-700">
            {phase.result.files.map((f) => (
              <li key={f.name} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                <span className="truncate text-ink-100">{f.name}</span>
                <span className="shrink-0 text-ink-400 tabular-nums">{formatBytes(f.blob.size)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-400">
            {phase.result.files.length} {phase.result.files.length === 1 ? 'archivo' : 'archivos'} · {formatBytes(phase.result.files.reduce((s, f) => s + f.blob.size, 0))} en total
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            {/* El libro .html se abre descargado (la vista previa en esta pestaña quedaría limitada por la CSP del sitio). */}
            {phase.result.download.name.match(/\.(pdf|png|jpg)$/) ? (
              <Button variant="ghost" onClick={() => preview(phase.result.download.blob)}>
                <Eye size={15} /> Abrir vista previa
              </Button>
            ) : (
              phase.result.files[0]?.name.match(/\.(png|jpg)$/) && (
                <Button variant="ghost" onClick={() => preview(phase.result.files[0].blob)}>
                  <Eye size={15} /> Ver el primero
                </Button>
              )
            )}
            <Button variant="ghost" onClick={() => downloadBlob(phase.result.download.blob, phase.result.download.name)}>
              <Download size={15} /> Descargar de nuevo
            </Button>
            <Button variant="primary" onClick={close}>
              Listo
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 p-4">
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Qué exportar">
            {presets.map((o) => (
              <button
                key={o.id}
                role="radio"
                aria-checked={preset === o.id}
                disabled={running}
                onClick={() => setPreset(o.id)}
                className={cx('flex items-start gap-3 rounded-xl border p-3 text-left transition-colors disabled:opacity-50', preset === o.id ? 'border-accent bg-accent-soft' : 'border-ink-700 hover:border-ink-500 hover:bg-ink-800')}
              >
                <span className="mt-0.5 text-accent-bright">{o.icon}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-white">{o.title}</span>
                  <span className="block text-[11px] text-ink-300">{o.detail}</span>
                  <span className="block text-[11px] text-ink-400">{o.use}</span>
                </span>
              </button>
            ))}
          </div>

          {preset === 'webtoon' && (
            <div className="space-y-3 rounded-xl bg-ink-900 p-3 ring-1 ring-ink-700" data-testid="opciones-webtoon">
              <Segmented
                value={wt.mode}
                onChange={(mode) => setWt({ ...wt, mode })}
                options={[
                  { value: 'continuous', label: 'Tira continua' },
                  { value: 'pages', label: 'Por página' },
                  { value: 'slices', label: 'Segmentos' },
                ]}
              />
              <div className="flex flex-wrap items-center gap-3 text-xs text-ink-300">
                <label className="flex items-center gap-1.5">
                  Formato
                  <select value={wt.format} onChange={(e) => setWt({ ...wt, format: e.target.value as 'jpg' | 'png' })} className="h-8 rounded border border-ink-600 bg-ink-950 px-1.5 text-white">
                    <option value="jpg">JPG</option>
                    <option value="png">PNG</option>
                  </select>
                </label>
                <label className="flex items-center gap-1.5">
                  Ancho final
                  <input type="number" min={200} max={4000} value={wt.targetWidth} onChange={(e) => setWt({ ...wt, targetWidth: Math.max(200, Math.min(4000, Number(e.target.value) || W)) })} className="h-8 w-20 rounded border border-ink-600 bg-ink-950 px-1.5 text-white" aria-label="Ancho final en píxeles" />
                  px
                </label>
                <label className="flex items-center gap-1.5">
                  Páginas
                  <input type="number" min={1} max={n} value={wt.from} onChange={(e) => setWt({ ...wt, from: Math.max(1, Math.min(n, Number(e.target.value) || 1)) })} className="h-8 w-14 rounded border border-ink-600 bg-ink-950 px-1.5 text-white" aria-label="Desde la página" />–
                  <input type="number" min={1} max={n} value={wt.to} onChange={(e) => setWt({ ...wt, to: Math.max(1, Math.min(n, Number(e.target.value) || n)) })} className="h-8 w-14 rounded border border-ink-600 bg-ink-950 px-1.5 text-white" aria-label="Hasta la página" />
                </label>
              </div>
              {wt.format === 'jpg' && <Slider label="Calidad" value={wt.quality} min={0.5} max={1} step={0.01} onChange={(quality) => setWt({ ...wt, quality })} format={(v) => `${Math.round(v * 100)} %`} />}
              {wt.mode === 'slices' && <Slider label="Alto máximo por segmento" value={wt.sliceMaxHeight} min={800} max={16000} step={100} onChange={(sliceMaxHeight) => setWt({ ...wt, sliceMaxHeight })} format={(v) => `${v} px`} />}
              {plan?.segmentedForSafety && (
                <p className="rounded bg-amber-950/40 p-2 text-[11px] text-amber-100" role="status">
                  La tira completa mediría {plan.totalHeight.toLocaleString('es-AR')} px de alto: es demasiado para un solo archivo seguro en todos los navegadores, así que se divide en partes numeradas.
                </p>
              )}
            </div>
          )}

          {!navigator.onLine && (
            <p className="rounded-lg bg-ink-900 p-2 text-[11px] text-ink-300" role="note">
              Sin conexión: las exportaciones que ya usaste en esta versión funcionan; las demás necesitan internet la primera vez para descargar su motor (PDF, ZIP).
            </p>
          )}
          {summary && !running && (
            <p className="text-xs text-ink-300" data-testid="resumen-exportacion">
              Se va a generar {summary.files === 1 ? '1 archivo' : `${summary.files} archivos`} · {summary.dims} · aprox. {formatBytes(Math.round(summary.bytes))}
            </p>
          )}
          {phase.kind === 'error' && (
            <p className="rounded-lg bg-red-950/50 p-2 text-xs text-red-100" role="alert">
              {phase.message}
            </p>
          )}
          {running ? (
            <div className="flex items-center gap-3" role="status">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-700">
                <div className="h-full bg-accent transition-all" style={{ width: `${(phase.done / Math.max(1, phase.total)) * 100}%` }} />
              </div>
              <span className="text-xs text-ink-200 tabular-nums">
                {phase.done}/{phase.total}
              </span>
              <Button variant="ghost" onClick={() => abort.current?.abort()}>
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={close}>
                <ArrowLeft size={15} /> Volver
              </Button>
              <Button variant="primary" onClick={() => void run()} disabled={!preset}>
                <Download size={15} /> Exportar
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
