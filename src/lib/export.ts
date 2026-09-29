import type { Page, Project } from '../types'
import { renderPage } from './render'
import { downloadBlob, exportProjectFile, safeFilename } from './storage'

export type ExportProgress = (done: number, total: number) => void

const dataURLToBlob = async (url: string) => (await fetch(url)).blob()

export async function exportPDF(project: Project, onProgress?: ExportProgress, quality: 'web' | 'print' = 'print') {
  const { jsPDF } = await import('jspdf')
  const { width, height } = project.format
  const orientation = width > height ? 'landscape' : 'portrait'
  const pdf = new jsPDF({ orientation, unit: 'px', format: [width, height], hotfixes: ['px_scaling'], compress: true })
  pdf.setProperties({ title: project.title, author: project.author, subject: project.synopsis, creator: 'Viñeta Studio' })
  const ratio = quality === 'print' ? 2 : 1
  for (let i = 0; i < project.pages.length; i++) {
    onProgress?.(i, project.pages.length)
    const url = await renderPage(project, project.pages[i], { pixelRatio: ratio, mime: 'image/jpeg', quality: 0.9 })
    if (i > 0) pdf.addPage([width, height], orientation)
    pdf.addImage(url, 'JPEG', 0, 0, width, height, undefined, 'FAST')
  }
  onProgress?.(project.pages.length, project.pages.length)
  downloadBlob(pdf.output('blob'), `${safeFilename(project.title)}.pdf`)
}

export async function exportPagePNG(project: Project, page: Page, pixelRatio = 2) {
  const url = await renderPage(project, page, { pixelRatio })
  const idx = project.pages.findIndex((p) => p.id === page.id) + 1
  downloadBlob(await dataURLToBlob(url), `${safeFilename(project.title)}-p${String(idx).padStart(2, '0')}.png`)
}

export async function exportZIP(project: Project, onProgress?: ExportProgress) {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const folder = zip.folder(safeFilename(project.title))!
  for (let i = 0; i < project.pages.length; i++) {
    onProgress?.(i, project.pages.length)
    const url = await renderPage(project, project.pages[i], { pixelRatio: 2 })
    folder.file(`${String(i + 1).padStart(3, '0')}.png`, await dataURLToBlob(url))
  }
  onProgress?.(project.pages.length, project.pages.length)
  downloadBlob(await zip.generateAsync({ type: 'blob' }), `${safeFilename(project.title)}.zip`)
}

/** Webtoon: todas las páginas unidas en una sola tira vertical larga. */
export async function exportWebtoonStrip(project: Project, onProgress?: ExportProgress) {
  const { width, height } = project.format
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height * project.pages.length
  if (canvas.height > 32000) throw new Error('La tira supera el alto máximo que soporta el navegador. Exportá como ZIP.')
  const ctx = canvas.getContext('2d')!
  for (let i = 0; i < project.pages.length; i++) {
    onProgress?.(i, project.pages.length)
    const img = new Image()
    img.src = await renderPage(project, project.pages[i], { pixelRatio: 1 })
    await img.decode()
    ctx.drawImage(img, 0, i * height)
  }
  onProgress?.(project.pages.length, project.pages.length)
  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.9))
  downloadBlob(blob, `${safeFilename(project.title)}-webtoon.jpg`)
}

export async function exportProject(project: Project) {
  downloadBlob(await exportProjectFile(project), `${safeFilename(project.title)}.vineta`)
}
