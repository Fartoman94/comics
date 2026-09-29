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

const frames = (n: number) =>
  new Promise<void>((res) => {
    const step = (i: number) => (i <= 0 ? res() : requestAnimationFrame(() => step(i - 1)))
    step(n)
  })

let queue: Promise<unknown> = Promise.resolve()

interface RenderOpts {
  pixelRatio?: number
  mime?: 'image/png' | 'image/jpeg'
  quality?: number
}

/** Renderiza una página fuera de pantalla (sin UI del editor) y devuelve un dataURL. */
export function renderPage(project: Project, page: Page, opts: RenderOpts = {}): Promise<string> {
  const job = queue.then(() => doRender(project, page, opts))
  queue = job.catch(() => undefined)
  return job
}

async function doRender(project: Project, page: Page, { pixelRatio = 1, mime = 'image/png', quality = 0.92 }: RenderOpts) {
  await loadFonts()
  await Promise.all(
    page.elements.flatMap((el) => (el.type === 'text' || el.type === 'bubble' ? [loadGlyphs(el.fontFamily, el.text, false), loadGlyphs(el.fontFamily, el.text, true)] : [])),
  )
  await preloadAssets(pageAssetIds(page))
  const { width, height } = project.format
  const host = document.createElement('div')
  host.style.cssText = `position:fixed;left:-${width + 1000}px;top:0;pointer-events:none;`
  document.body.appendChild(host)
  const root = createRoot(host)
  try {
    const stage = await new Promise<Konva.Stage>((resolve) => {
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
    })
    // Los filtros de imagen se cachean en efectos: dejamos pasar un par de frames.
    await frames(3)
    stage.draw()
    return stage.toDataURL({ pixelRatio, mimeType: mime, quality })
  } finally {
    root.unmount()
    host.remove()
  }
}
