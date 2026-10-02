import type { Page, Project } from '../types'
import { renderPageCanvas } from './render'
import { downloadBlob, exportProjectFile, safeFilename } from './storage'
import { isSafeCanvas, numbered, planStrip, type ImageFormat, type StripMode } from './exportPlan'

export type ExportProgress = (done: number, total: number) => void

export interface ExportFile {
  name: string
  blob: Blob
}
/** Lo que produce una exportación: los archivos y el que se descarga (uno solo o un ZIP con todos). */
export interface ExportResult {
  files: ExportFile[]
  download: ExportFile
}
export interface ExportCtx {
  onProgress?: ExportProgress
  signal?: AbortSignal
}

/** El usuario canceló: no es un error para mostrar. */
export class ExportCancelled extends Error {
  constructor() {
    super('Exportación cancelada')
    this.name = 'ExportCancelled'
  }
}
/** Error con mensaje para el usuario (en español). */
export class ExportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExportError'
  }
}

const check = (ctx?: ExportCtx) => {
  if (ctx?.signal?.aborted) throw new ExportCancelled()
}
const free = (c: HTMLCanvasElement) => {
  c.width = 0
  c.height = 0
}
const toBlob = (c: HTMLCanvasElement, mime: string, quality?: number) =>
  new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new ExportError('El navegador no pudo generar la imagen (memoria insuficiente).'))), mime, quality))

/** Dibuja una página; si falla, el error dice cuál (nunca se entrega un archivo incompleto). */
async function page(project: Project, index: number, ratio: number) {
  const p = project.pages[index]
  try {
    return await renderPageCanvas(project, p, ratio)
  } catch (e) {
    console.error(e)
    throw new ExportError(`No se pudo dibujar la página ${index + 1} («${p.name}»). No se generó ningún archivo.`)
  }
}

const base = (p: Project) => safeFilename(p.title)

/** PDF página por página (sin retener todas las imágenes). En manga declara lectura de derecha a izquierda. */
export async function exportPDF(project: Project, quality: 'web' | 'print' = 'print', ctx: ExportCtx = {}): Promise<ExportResult> {
  const { jsPDF } = await import('jspdf')
  const { width, height } = project.format
  const orientation = width > height ? 'landscape' : 'portrait'
  const pdf = new jsPDF({ orientation, unit: 'px', format: [width, height], hotfixes: ['px_scaling'], compress: true })
  pdf.setProperties({ title: project.title, author: project.author, subject: project.synopsis, creator: 'Viñeta Studio' })
  if (project.readingDirection === 'rtl') pdf.viewerPreferences({ Direction: 'R2L' }, true)
  const ratio = quality === 'print' ? 2 : 1
  const n = project.pages.length
  for (let i = 0; i < n; i++) {
    check(ctx)
    ctx.onProgress?.(i, n)
    const canvas = await page(project, i, ratio)
    const bytes = new Uint8Array(await (await toBlob(canvas, 'image/jpeg', quality === 'print' ? 0.92 : 0.82)).arrayBuffer())
    free(canvas)
    if (i > 0) pdf.addPage([width, height], orientation)
    pdf.addImage(bytes, 'JPEG', 0, 0, width, height, undefined, 'FAST')
  }
  check(ctx)
  ctx.onProgress?.(n, n)
  const file = { name: `${base(project)}${quality === 'web' ? '-liviano' : ''}.pdf`, blob: pdf.output('blob') }
  return { files: [file], download: file }
}

export async function exportPagePNG(project: Project, p: Page, pixelRatio = 2): Promise<ExportResult> {
  const index = project.pages.findIndex((x) => x.id === p.id)
  const canvas = await page(project, index, pixelRatio)
  const file = { name: numbered(base(project), index, project.pages.length, 'png'), blob: await toBlob(canvas, 'image/png') }
  free(canvas)
  return { files: [file], download: file }
}

async function zipFiles(name: string, files: ExportFile[]): Promise<ExportFile> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  for (const f of files) zip.file(f.name, f.blob)
  return { name, blob: await zip.generateAsync({ type: 'blob', compression: 'STORE' }) }
}

/** Un PNG por página, numerados y ordenables (titulo-001.png…), en un ZIP. */
export async function exportZIP(project: Project, ctx: ExportCtx = {}): Promise<ExportResult> {
  const n = project.pages.length
  const files: ExportFile[] = []
  for (let i = 0; i < n; i++) {
    check(ctx)
    ctx.onProgress?.(i, n)
    const canvas = await page(project, i, 2)
    files.push({ name: numbered(base(project), i, n, 'png'), blob: await toBlob(canvas, 'image/png') })
    free(canvas)
  }
  check(ctx)
  ctx.onProgress?.(n, n)
  return { files, download: await zipFiles(`${base(project)}.zip`, files) }
}

export interface WebtoonOptions {
  format: ImageFormat
  quality: number
  targetWidth: number
  mode: StripMode
  sliceMaxHeight: number
  /** Rango de páginas (1..n, inclusive). */
  from: number
  to: number
}

export function webtoonPlan(project: Project, o: WebtoonOptions) {
  const from = Math.max(1, Math.min(o.from, project.pages.length))
  const to = Math.max(from, Math.min(o.to, project.pages.length))
  return planStrip({
    title: base(project),
    pageWidth: project.format.width,
    pageHeight: project.format.height,
    pages: [...Array(to - from + 1).keys()].map((i) => i + from - 1),
    targetWidth: o.targetWidth,
    format: o.format,
    quality: o.quality,
    mode: o.mode,
    sliceMaxHeight: o.sliceMaxHeight,
  })
}

/**
 * Webtoon: tira continua, páginas separadas o división numerada. Nunca crea un canvas que pase los
 * límites de Safari/iOS (se segmenta antes) y libera cada canvas apenas lo usa.
 */
export async function exportWebtoon(project: Project, o: WebtoonOptions, ctx: ExportCtx = {}): Promise<ExportResult> {
  const plan = webtoonPlan(project, o)
  const mime = o.format === 'png' ? 'image/png' : 'image/jpeg'
  const files: ExportFile[] = []
  // Última página dibujada (se reusa si cae en varios segmentos).
  const cache: { current: { index: number; canvas: HTMLCanvasElement } | null } = { current: null }
  const total = plan.files.length
  try {
    for (let f = 0; f < total; f++) {
      check(ctx)
      ctx.onProgress?.(f, total)
      const spec = plan.files[f]
      if (!isSafeCanvas(spec.width, spec.height)) throw new ExportError('Un segmento supera el tamaño seguro de imagen. Elegí un alto máximo menor.')
      const out = document.createElement('canvas')
      out.width = spec.width
      out.height = spec.height
      const g = out.getContext('2d')
      if (!g) throw new ExportError('El navegador no pudo crear la imagen (memoria insuficiente). Probá con un alto máximo menor.')
      if (o.format === 'jpg') {
        g.fillStyle = '#ffffff'
        g.fillRect(0, 0, spec.width, spec.height)
      }
      for (const part of spec.parts) {
        check(ctx)
        // Cada página se dibuja una sola vez aunque quede repartida en varios segmentos.
        if (cache.current?.index !== part.page) {
          if (cache.current) free(cache.current.canvas)
          cache.current = { index: part.page, canvas: await page(project, part.page, plan.scale) }
        }
        const src = cache.current.canvas
        const k = src.height / Math.round(project.format.height * plan.scale)
        g.drawImage(src, 0, part.srcY * k, src.width, part.height * k, 0, part.dstY, spec.width, part.height)
      }
      files.push({ name: spec.name, blob: await toBlob(out, mime, o.format === 'jpg' ? o.quality : undefined) })
      free(out)
    }
  } finally {
    if (cache.current) free(cache.current.canvas)
  }
  check(ctx)
  ctx.onProgress?.(total, total)
  return { files, download: files.length === 1 ? files[0] : await zipFiles(`${base(project)}-webtoon.zip`, files) }
}

export async function exportProject(project: Project): Promise<ExportResult> {
  const file = { name: `${base(project)}.vineta`, blob: await exportProjectFile(project) }
  return { files: [file], download: file }
}

/** Atajo para el inicio: descarga el .vineta directamente. */
export async function downloadProject(project: Project) {
  const r = await exportProject(project)
  downloadBlob(r.download.blob, r.download.name)
}
