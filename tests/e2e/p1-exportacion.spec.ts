import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import JSZip from 'jszip'
import { createProjectInDb, exportPreset, gotoHome, inApp, openProject, skipTour } from './helpers'

test.beforeEach(async ({ page }) => {
  await skipTour(page)
  await page.addInitScript(() => localStorage.setItem('vineta:ayudas-apagadas', '1'))
})

const pngSize = (b: Buffer) => ({ w: b.readUInt32BE(16), h: b.readUInt32BE(20), png: b.subarray(1, 4).toString() === 'PNG' })
const LIMIT = { area: 16_777_216, side: 16_384 }

async function openExport(page: Page) {
  await page.getByRole('button', { name: /Exportar/ }).first().click()
  await page.getByText('Exportar…').click()
  await expect(page.getByRole('dialog', { name: 'Exportar' })).toBeVisible()
}

test('webtoon de más de 16,7 Mpx: se segmenta, completa y cada archivo es válido', async ({ page }) => {
  test.setTimeout(180_000)
  await gotoHome(page)
  const id = await createProjectInDb(page, 'Webtoon largo', 'webtoon', 10) // 800 × 24.000 px = 19,2 Mpx
  await openProject(page, id)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await openExport(page)
  await page.getByRole('radio', { name: /^Webtoon/ }).click()
  const opts = page.getByTestId('opciones-webtoon')
  await opts.getByRole('button', { name: 'Tira continua' }).click()
  await opts.getByLabel('Formato').selectOption('png')
  await expect(opts.getByRole('status')).toContainText('se divide en partes numeradas')
  await expect(page.getByTestId('resumen-exportacion')).toContainText(/archivos/)
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 150_000 }), page.getByRole('dialog', { name: 'Exportar' }).getByRole('button', { name: 'Exportar', exact: true }).click()])
  expect(dl.suggestedFilename()).toBe('webtoon-largo-webtoon.zip')
  const zip = await JSZip.loadAsync(readFileSync((await dl.path())!))
  const names = Object.keys(zip.files).sort()
  expect(names.length).toBeGreaterThan(1)
  expect(names).toEqual(names.map((_, i) => `webtoon-largo-${String(i + 1).padStart(3, '0')}.png`))
  let total = 0
  for (const n of names) {
    const s = pngSize(Buffer.from(await zip.files[n].async('uint8array')))
    expect(s.png).toBe(true)
    expect(s.w).toBe(800)
    expect(s.w * s.h).toBeLessThanOrEqual(LIMIT.area)
    expect(s.h).toBeLessThanOrEqual(LIMIT.side)
    total += s.h
  }
  expect(total).toBe(24000)
  await expect(page.getByTestId('exportacion-lista')).toContainText(`${names.length} archivos`)
  expect(errors).toEqual([])
})

test('cancelar: no descarga, no queda bloqueado y no deja URLs vivas', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __urls: Set<string> }
    w.__urls = new Set()
    const create = URL.createObjectURL.bind(URL)
    const revoke = URL.revokeObjectURL.bind(URL)
    URL.createObjectURL = (o: Blob | MediaSource) => {
      const u = create(o)
      w.__urls.add(u)
      return u
    }
    URL.revokeObjectURL = (u: string) => {
      w.__urls.delete(u)
      revoke(u)
    }
  })
  await gotoHome(page)
  const id = await createProjectInDb(page, 'Cancelar', 'comic', 8)
  await openProject(page, id)
  await openExport(page)
  await page.getByRole('radio', { name: /Imprenta/ }).click()
  let downloaded = false
  page.on('download', () => (downloaded = true))
  await page.getByRole('dialog', { name: 'Exportar' }).getByRole('button', { name: 'Exportar', exact: true }).click()
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByRole('dialog', { name: 'Exportar' }).getByRole('button', { name: 'Exportar', exact: true })).toBeEnabled()
  await page.waitForTimeout(1500)
  expect(downloaded).toBe(false)
  await page.getByRole('dialog', { name: 'Exportar' }).getByRole('button', { name: 'Volver' }).click()
  expect(await page.evaluate(() => (window as unknown as { __urls: Set<string> }).__urls.size)).toBe(0)
})

test('si una página falla, se informa cuál y no se entrega un ZIP incompleto', async ({ page }) => {
  await gotoHome(page)
  const id = await createProjectInDb(page, 'Con falla', 'comic', 3)
  await openProject(page, id)
  await inApp(page, `window.__vinetaFallarPagina = s.project.pages[1].id`)
  await openExport(page)
  await page.getByRole('radio', { name: /Páginas en imágenes/ }).click()
  let downloaded = false
  page.on('download', () => (downloaded = true))
  await page.getByRole('dialog', { name: 'Exportar' }).getByRole('button', { name: 'Exportar', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Exportar' }).getByRole('alert')).toContainText('No se pudo dibujar la página 2')
  await page.waitForTimeout(800)
  expect(downloaded).toBe(false)
})

test('PDF: manga declara lectura de derecha a izquierda; cómic no; páginas correctas', async ({ page }) => {
  await gotoHome(page)
  for (const [kind, rtl] of [
    ['manga', true],
    ['comic', false],
  ] as const) {
    const id = await createProjectInDb(page, `PDF ${kind}`, kind, 3)
    await openProject(page, id)
    const dl = await exportPreset(page, /Pantalla \(PDF liviano\)/)
    const pdf = readFileSync((await dl.path())!).toString('latin1')
    expect(pdf.startsWith('%PDF')).toBe(true)
    expect((pdf.match(/\/Type \/Page\b/g) ?? []).length).toBe(3)
    expect(pdf.includes('/Direction /R2L')).toBe(rtl)
    await page.getByRole('button', { name: 'Listo' }).click()
    await page.getByTitle('Volver a mis proyectos').first().click()
  }
})

test('ZIP de páginas: nombres ordenables, PNG y dimensiones; exportar no muta el proyecto ni el historial', async ({ page }) => {
  await gotoHome(page)
  const id = await createProjectInDb(page, 'Mi Cómic', 'comic', 3)
  await openProject(page, id)
  await inApp(page, `s.updateElement(s.project.pages[0].elements[0].id, { x: 10 })`)
  const before = await inApp<string>(page, 'return JSON.stringify({ p: s.project.pages, past: s.past.length, future: s.future.length })')
  const dl = await exportPreset(page, /Páginas en imágenes/)
  expect(dl.suggestedFilename()).toBe('mi-cómic.zip')
  const zip = await JSZip.loadAsync(readFileSync((await dl.path())!))
  // P10: nombres deterministas pagina-001.png, pagina-002.png…
  expect(Object.keys(zip.files).sort()).toEqual(['pagina-001.png', 'pagina-002.png', 'pagina-003.png'])
  const s = pngSize(Buffer.from(await zip.files['pagina-001.png'].async('uint8array')))
  expect(s).toEqual({ w: 994 * 2, h: 1538 * 2, png: true })
  expect(await inApp<string>(page, 'return JSON.stringify({ p: s.project.pages, past: s.past.length, future: s.future.length })')).toBe(before)
})

test('CJK, imagen de 4096 px con transparencia y .vineta por partes que se vuelve a importar', async ({ page }) => {
  test.setTimeout(120_000)
  await gotoHome(page)
  const id = await createProjectInDb(page, 'Grande', 'manga', 2)
  await openProject(page, id)
  // Imagen de 4096×4096 con transparencia, generada en el navegador.
  await inApp(
    page,
    `const c = new OffscreenCanvas(4096, 4096); const g = c.getContext('2d'); g.fillStyle = 'rgba(255,0,0,0.5)'; g.fillRect(0, 0, 4096, 2048)
     const blob = await c.convertToBlob({ type: 'image/png' })
     const assets = await m.placement.importFiles([new File([blob], 'grande.png', { type: 'image/png' })])
     s.setPage(s.project.pages[1].id); m.placement.placeAsset(assets[0])
     const t = m.factories.createText(50, 50); t.text = 'ドドド 쾅 轰'; t.vertical = true; m.store.useEditor.getState().addElements([t])`,
  )
  expect(await inApp<number[]>(page, 'const a = s.project.assets[0]; return [a.width, a.height]')).toEqual([4096, 4096])
  const zipDl = await exportPreset(page, /Páginas en imágenes/)
  expect(Object.keys((await JSZip.loadAsync(readFileSync((await zipDl.path())!))).files)).toHaveLength(2)
  await page.getByRole('button', { name: 'Listo' }).click()
  const vin = await exportPreset(page, /Archivo editable/)
  const text = readFileSync((await vin.path())!, 'utf8')
  const data = JSON.parse(text)
  expect(data.app).toBe('vineta-studio')
  expect(Object.values(data.blobs)[0]).toMatch(/^data:image\/png;base64,/)
  const ok = await inApp<boolean>(page, `const p = await m.storage.importProjectFile(new File([arg], 'g.vineta')); return p.assets[0].width === 4096`, text)
  expect(ok).toBe(true)
})

test('resumen antes de exportar, lista final y último preset recordado por tipo de obra', async ({ page }) => {
  await gotoHome(page)
  const id = await createProjectInDb(page, 'Presets', 'comic', 2)
  await openProject(page, id)
  await openExport(page)
  await page.getByRole('radio', { name: /Imprenta/ }).click()
  await expect(page.getByTestId('resumen-exportacion')).toContainText('2 páginas de 1988×3076')
  await Promise.all([page.waitForEvent('download'), page.getByRole('dialog', { name: 'Exportar' }).getByRole('button', { name: 'Exportar', exact: true }).click()])
  await expect(page.getByTestId('exportacion-lista')).toContainText('presets.pdf')
  await expect(page.getByTestId('exportacion-lista')).toContainText('en total')
  await page.getByRole('button', { name: 'Listo' }).click()
  await openExport(page)
  await expect(page.getByRole('radio', { name: /Imprenta/ })).toHaveAttribute('aria-checked', 'true')
})

test('webtoon: marco de teléfono configurable, pasos de pantalla, scroll a ancho de teléfono y no se exporta', async ({ page }) => {
  await gotoHome(page)
  const id = await createProjectInDb(page, 'Marco', 'webtoon', 2)
  await openProject(page, id)
  const plain = await inApp<string>(page, `return await (await import('/src/lib/render.tsx')).renderPage(s.project, s.project.pages[0], { pixelRatio: 0.2 })`)
  await page.getByRole('button', { name: 'Vista de pantalla del teléfono' }).click()
  const bar = page.getByRole('toolbar', { name: 'Vista de pantalla del teléfono' })
  for (const [dev, w, h] of [
    ['360x800', 360, 800],
    ['390x844', 390, 844],
    ['430x932', 430, 932],
  ] as const) {
    await bar.getByLabel('Tamaño de teléfono').selectOption(dev)
    const ui = await page.evaluate(async () => (await import(/* @vite-ignore */ '/src/store/ui.ts' as string)).useUi.getState().phoneFrame)
    expect(ui.device).toBe(dev)
    // Alto del marco = ancho de página × proporción del teléfono; avanza una pantalla (sin pasarse del final).
    const fh = 800 * (h / w)
    await bar.getByRole('button', { name: 'Pantalla siguiente' }).click()
    const y = await page.evaluate(async () => (await import(/* @vite-ignore */ '/src/store/ui.ts' as string)).useUi.getState().phoneFrame.y)
    expect(y).toBeCloseTo(Math.min(fh, 2400 - fh), 0)
    await bar.getByRole('button', { name: 'Pantalla anterior' }).click()
  }
  // Al llegar al final de la página, la pantalla siguiente es la página que sigue.
  for (let i = 0; i < 3; i++) await bar.getByRole('button', { name: 'Pantalla siguiente' }).click()
  expect(await inApp<number>(page, 'return s.project.pages.findIndex(p => p.id === s.pageId)')).toBe(1)
  // La exportación no incluye el marco.
  const withFrame = await inApp<string>(page, `return await (await import('/src/lib/render.tsx')).renderPage(s.project, s.project.pages[0], { pixelRatio: 0.2 })`)
  expect(withFrame).toBe(plain)
  await bar.getByRole('button', { name: 'Previsualizar scroll' }).click()
  const phone = page.getByTestId('pantalla-telefono')
  await expect(phone).toBeVisible()
  expect(Math.round((await phone.boundingBox())!.width)).toBe(430 + 16)
  expect(await phone.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true)
})
