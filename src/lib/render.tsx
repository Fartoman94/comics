import { createRoot } from 'react-dom/client'
import { Layer, Stage } from 'react-konva'
import type Konva from 'konva'
import type { Page, Project } from '../types'
import { PageContent } from '../components/editor/nodes/PageContent'
import { preloadAssets } from './assetCache'
import { loadFonts, loadGlyphs } from './fonts'

export function pageAssetIds(page: Page): string[] {
  const ids: string[] = []
  for (const el of page.elements) {
    if (el.type === 'image') ids.push(el.assetId)
    if (el.type === 'panel' && el.image) ids.push(el.image.assetId)
  }
  return ids
}

// requestAnimationFrame se congela en pestañas ocultas: siempre hay un respaldo con setTimeout.
const frame = () => new Promise<void>((res) => {
  const t = setTimeout(res, 60)
  requestAnimationFrame(() => {
    clearTimeout(t)
    res()
  })
})
const frames = async (n: number) => {
  for (let i = 0; i < n; i++) await frame()
}

function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise<T>((res, rej) => {
    const t = setTimeout(() => rej(new Error(`Tiempo agotado: ${what}`)), ms)
    p.then(
      (v) => {
        clearTimeout(t)
        res(v)
      },
      (e) => {
        clearTimeout(t)
        rej(e)
      },
    )
  })
}

let queue: Promise<unknown> = Promise.resolve()

interface RenderOpts {
  pixelRatio?: number
  mime?: 'image/png' | 'image/jpeg'
  quality?: number
}

/** Renderiza una página fuera de pantalla (sin UI del editor) y devuelve un dataURL. */
export function renderPage(project: Project, page: Page, opts: RenderOpts = {}): Promise<string> {
  return enqueue(project, page, (stage) => stage.toDataURL({ pixelRatio: opts.pixelRatio ?? 1, mimeType: opts.mime ?? 'image/png', quality: opts.quality ?? 0.92 }))
}

/**
 * Igual, pero devuelve un canvas (para exportar sin pasar por dataURL). Quien lo pide lo libera
 * (canvas.width = 0) cuando termina.
 */
export function renderPageCanvas(project: Project, page: Page, pixelRatio = 1): Promise<HTMLCanvasElement> {
  return enqueue(project, page, (stage) => stage.toCanvas({ pixelRatio }))
}

function enqueue<T>(project: Project, page: Page, out: (stage: Konva.Stage) => T): Promise<T> {
  const job = queue.then(() => withTimeout(doRender(project, page, out), 30000, `renderizar "${page.name}"`))
  queue = job.catch(() => undefined)
  return job
}

async function doRender<T>(project: Project, page: Page, out: (stage: Konva.Stage) => T): Promise<T> {
  // Sólo en desarrollo: permite a los tests simular una página que no se puede dibujar.
  if (import.meta.env.DEV && (window as unknown as { __vinetaFallarPagina?: string }).__vinetaFallarPagina === page.id) throw new Error('fallo simulado')
  await withTimeout(loadFonts(), 8000, 'fuentes').catch(() => undefined)
  await withTimeout(
    Promise.all(page.elements.flatMap((el) => (el.type === 'text' || el.type === 'bubble' ? [loadGlyphs(el.fontFamily, el.text, false), loadGlyphs(el.fontFamily, el.text, true)] : []))),
    8000,
    'glifos',
  ).catch(() => undefined)
  await withTimeout(preloadAssets(pageAssetIds(page)), 15000, 'imágenes')
  const { width, height } = project.format
  const host = document.createElement('div')
  host.style.cssText = `position:fixed;left:-${width + 1000}px;top:0;pointer-events:none;`
  document.body.appendChild(host)
  const root = createRoot(host)
  try {
    const stage = await withTimeout(new Promise<Konva.Stage>((resolve) => {
      root.render(
        <Stage
          ref={(s) => {
            if (s) resolve(s)
          }} width={width} height={height} listening={false}>
          <Layer>
            <PageContent page={page} format={project.format} />
          </Layer>
        </Stage>,
      )
    }), 8000, 'montar el lienzo')
    // Los filtros de imagen se cachean en efectos: dejamos pasar un par de frames.
    await frames(3)
    stage.draw()
    return out(stage)
  } finally {
    root.unmount()
    host.remove()
  }
}
