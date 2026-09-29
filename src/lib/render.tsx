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
  const job = queue.then(() => withTimeout(doRender(project, page, opts), 30000, `renderizar "${page.name}"`))
  queue = job.catch(() => undefined)
  return job
}

async function doRender(project: Project, page: Page, { pixelRatio = 1, mime = 'image/png', quality = 0.92 }: RenderOpts) {
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
    return stage.toDataURL({ pixelRatio, mimeType: mime, quality })
  } finally {
    root.unmount()
    host.remove()
  }
}
