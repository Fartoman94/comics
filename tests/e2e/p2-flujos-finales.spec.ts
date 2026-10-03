import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import JSZip from 'jszip'
import { canvasPoint, clippedControls, exportPreset, FIXTURES, gotoHome, inApp, openView, projectCard, skipTour } from './helpers'

// Validación final (etapa 09): los recorridos completos de punta a punta, con los archivos
// exportados abiertos y verificados, no sólo descargados.

test.beforeEach(async ({ page }) => {
  await skipTour(page)
  await page.addInitScript(() => localStorage.setItem('vineta:ayudas-apagadas', '1'))
})

type Summary = { pages: number; filled: number; bubbles: string[]; hidden: number }
const summary = (page: Page) =>
  inApp<Summary>(
    page,
    `const els = s.project.pages.flatMap(p => p.elements)
     return { pages: s.project.pages.length, filled: els.filter(e => e.type === 'panel' && e.image).length, bubbles: els.filter(e => e.type === 'bubble').map(e => e.text).sort(), hidden: els.filter(e => e.hidden).length }`,
  )
const panelsOfPage = (page: Page) => inApp<string[]>(page, `return s.project.pages.find(p => p.id === s.pageId).elements.filter(e => e.type === 'panel').map(e => e.id)`)

test('escritorio: plantilla → fotos → viñetas → guion → capas → preview → lector → exportar todo → recargar', async ({ page, context }, info) => {
  test.setTimeout(180_000)
  await gotoHome(page)
  // 1. Crear desde plantilla con el asistente.
  await page.getByRole('button', { name: 'Nuevo proyecto' }).first().click()
  await page.getByRole('radio', { name: /^Cómic/ }).click()
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await page.getByRole('radio', { name: /Con plantilla/ }).click()
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await page.getByRole('textbox', { name: 'Título' }).fill('Flujo final')
  await page.getByRole('button', { name: 'Crear proyecto' }).click()
  await expect(page.locator('[data-ui-mode=studio]')).toBeVisible()
  // La página 1 de la plantilla es la portada (una viñeta); se trabaja en la 2.
  await inApp(page, 's.setPage(s.project.pages[1].id)')
  const panels = await panelsOfPage(page)
  expect(panels.length).toBeGreaterThanOrEqual(2)

  // 2. Subir fotos.
  await page.getByRole('tab', { name: 'Imágenes' }).click()
  await page.locator('input[type=file][accept="image/*"]').setInputFiles([FIXTURES + 'foto-a.png', FIXTURES + 'foto-b.png'])
  await expect.poll(() => inApp<number>(page, 'return s.project.assets.length')).toBe(2)

  // 3. Llenar viñetas: clic en la viñeta del lienzo y clic en la foto.
  for (const [i, name] of [[0, 'foto-a'], [1, 'foto-b']] as const) {
    const p = await canvasPoint(page, panels[i])
    await page.mouse.click(p.x, p.y)
    await expect.poll(() => inApp<string[]>(page, 'return s.selection')).toEqual([panels[i]])
    await page.getByRole('img', { name }).click()
  }
  await expect.poll(async () => (await summary(page)).filled).toBe(2)

  // 4. Guion → globo colocado en la viñeta 1.
  await page.getByRole('tab', { name: 'Guion' }).click()
  const vin1 = page.getByTestId('guion').getByRole('region', { name: 'Viñeta 1' })
  await vin1.getByRole('button', { name: '+ Agregar' }).click()
  await page.getByRole('button', { name: 'Diálogo', exact: true }).click()
  await vin1.getByRole('textbox', { name: 'Texto: Diálogo' }).fill('¡Arrancamos!')
  await vin1.getByRole('button', { name: 'Colocar' }).first().click()
  await expect(vin1.getByText('Colocado')).toBeVisible()
  await expect.poll(async () => (await summary(page)).bubbles).toContain('¡Arrancamos!')

  // 5. Capas: ocultar y volver a mostrar el globo; bloquear y desbloquear.
  await page.getByRole('tab', { name: 'Capas' }).click()
  const row = page.locator('li').filter({ hasText: /^Diálogo/ }).first()
  await row.hover()
  await row.getByRole('button', { name: 'Ocultar' }).click()
  await expect.poll(async () => (await summary(page)).hidden).toBe(1)
  await row.getByRole('button', { name: 'Mostrar' }).click()
  await row.hover()
  await row.getByRole('button', { name: 'Bloquear' }).click()
  await row.getByRole('button', { name: 'Desbloquear' }).click()
  await expect.poll(async () => (await summary(page)).hidden).toBe(0)

  // 6. Previsualizar y volver.
  await openView(page, 'Previsualizar')
  await expect(page.getByRole('dialog', { name: /Previsualización/ })).toBeVisible()
  await expect(page.getByTestId('previsualizacion').locator('img')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: /Previsualización/ })).toHaveCount(0)

  // 7. Lector: pasar página y cerrar.
  await openView(page, 'Leer')
  await expect(page.getByRole('slider', { name: 'Ir a página' })).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Página siguiente' }).click()
  await page.getByRole('button', { name: 'Cerrar lectura' }).click()
  await expect(page.locator('[data-tour=read]')).toBeFocused()

  const expected = await summary(page)

  // 8. Exportar los cuatro formatos y abrir cada archivo.
  const pdf = readFileSync((await (await exportPreset(page, /Pantalla/)).path())!)
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
  expect(pdf.toString('latin1').match(/\/Type \/Page\b/g)).toHaveLength(expected.pages)
  await page.getByRole('button', { name: 'Listo' }).click()

  const zip = await JSZip.loadAsync(readFileSync((await (await exportPreset(page, /Páginas en PNG/)).path())!))
  const pngs = Object.keys(zip.files).filter((n) => n.endsWith('.png'))
  expect(pngs).toHaveLength(expected.pages)
  const first = Buffer.from(await zip.files[pngs.sort()[0]].async('uint8array'))
  expect(first.subarray(1, 4).toString()).toBe('PNG')
  await page.getByRole('button', { name: 'Listo' }).click()

  const htmlPath = info.outputPath('flujo.html')
  await (await exportPreset(page, /Libro web/)).saveAs(htmlPath)
  await page.getByRole('button', { name: 'Listo' }).click()
  const book = await context.newPage()
  const bookErrors: string[] = []
  book.on('pageerror', (e) => bookErrors.push(String(e)))
  await book.goto('file://' + htmlPath)
  await expect(book.locator('#num')).toHaveText(`Página 1 de ${expected.pages}`)
  await book.getByRole('button', { name: 'Página siguiente' }).click()
  await expect(book.locator('#num')).toHaveText(`Páginas 2–3 de ${expected.pages}`)
  expect(bookErrors).toEqual([])
  await book.close()

  const vinPath = info.outputPath('flujo.vineta')
  await (await exportPreset(page, /Archivo editable/)).saveAs(vinPath)
  await page.getByRole('button', { name: 'Listo' }).click()

  // 9. Recargar: todo sigue guardado.
  await expect.poll(() => inApp<string>(page, 'return s.saveStatus')).toBe('saved')
  await page.reload()
  await expect(page.locator('[data-ui-mode]')).toBeVisible()
  expect(await summary(page)).toEqual(expected)

  // 10. El .vineta exportado se vuelve a importar como copia completa, con sus imágenes.
  await gotoHome(page)
  await page.locator('input[type=file][accept=".vineta,application/json"]').setInputFiles(vinPath)
  await expect(projectCard(page, 'Flujo final')).toHaveCount(2)
  await page.locator('main article').first().locator('button').first().click()
  await expect(page.locator('[data-ui-mode]')).toBeVisible()
  expect(await summary(page)).toEqual(expected)
  const broken = await inApp<number>(
    page,
    `let bad = 0; for (const a of s.project.assets) { const img = await m.assets.loadAssetImage(a.id); if (!img || img.naturalWidth === 0) bad++ } return bad`,
  )
  expect(broken).toBe(0)
})

test.describe('tablet 820×1180 táctil', () => {
  test.use({ viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true })

  test('simple ↔ estudio, lápiz y dedo, pellizco/arrastre, capas y lectura con swipe', async ({ page }) => {
    test.setTimeout(120_000)
    await gotoHome(page)
    await page.getByRole('button', { name: 'Nuevo proyecto' }).first().tap()
    await page.getByRole('button', { name: 'Crear rápido' }).tap()
    // En tablet arranca en estudio (simple es el predeterminado por debajo de 768 px).
    await expect(page.locator('[data-ui-mode=studio]')).toBeVisible()
    await page.getByRole('button', { name: 'Exportar' }).tap()
    await page.getByRole('button', { name: 'Modo simple' }).tap()
    await expect(page.locator('[data-ui-mode=simple]')).toBeVisible()
    await page.getByRole('button', { name: 'Más opciones del proyecto' }).tap()
    await page.getByRole('button', { name: 'Modo estudio' }).tap()
    await expect(page.locator('[data-ui-mode=studio]')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)

    // Lápiz: trazo con presión real.
    await inApp(page, 's.select([])')
    await page.keyboard.press('b')
    const cdp = await page.context().newCDPSession(page)
    const a = await canvasPoint(page, { x: 200, y: 300 })
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: a.x, y: a.y, button: 'left', clickCount: 1, pointerType: 'pen', force: 0.8 })
    for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: a.x + i * 20, y: a.y + i * 12, button: 'left', buttons: 1, pointerType: 'pen', force: 0.8 })
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: a.x + 120, y: a.y + 72, button: 'left', clickCount: 1, pointerType: 'pen' })
    const pen = await inApp<number[]>(page, `const d = s.project.pages[0].elements.filter(e => e.type === 'drawing').at(-1); return d.strokes.at(-1).points.map(p => p[2])`)
    expect(pen.length).toBeGreaterThan(3)
    expect(pen.some((p) => p > 0.6)).toBe(true) // la presión del lápiz se guarda

    // Dedo: trazo con el mismo pincel.
    const strokes = () => inApp<number>(page, `return s.project.pages[0].elements.filter(e => e.type === 'drawing').flatMap(d => d.strokes).length`)
    const before = await strokes()
    const f = await canvasPoint(page, { x: 200, y: 600 })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: f.x, y: f.y }] })
    for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: f.x + i * 15, y: f.y + i * 5 }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect.poll(strokes).toBe(before + 1)
    await page.keyboard.press('v')

    // Pellizco de dos dedos: cambia el zoom y no crea trazos ni mueve nada.
    const zoom0 = await inApp<number>(page, 'return s.zoom')
    const c = await canvasPoint(page, { x: 500, y: 800 })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c.x - 40, y: c.y, id: 1 }, { x: c.x + 40, y: c.y, id: 2 }] })
    for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: c.x - 40 - i * 15, y: c.y, id: 1 }, { x: c.x + 40 + i * 15, y: c.y, id: 2 }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect.poll(() => inApp<number>(page, 'return s.zoom')).toBeGreaterThan(zoom0)
    expect(await strokes()).toBe(before + 1)

    // Capas con el dedo: los botones están visibles sin hover y ocultan de verdad.
    await page.getByRole('button', { name: 'Capas', exact: true }).tap()
    const hide = page.getByRole('button', { name: 'Ocultar' }).first()
    await expect(hide).toBeVisible()
    expect(await hide.evaluate((b) => getComputedStyle(b).opacity)).toBe('1')
    await hide.tap()
    await expect.poll(() => inApp<number>(page, 'return s.project.pages[0].elements.filter(e => e.hidden).length')).toBe(1)

    await page.getByRole('dialog', { name: 'Capas' }).getByRole('button', { name: 'Cerrar' }).tap()

    // Lectura con swipe.
    await openView(page, 'Leer')
    await expect(page.getByRole('slider', { name: 'Ir a página' })).toBeVisible({ timeout: 30_000 })
    await page.waitForTimeout(300)
    const state = () => page.getByTestId('lectura-estado').innerText()
    const start = await state()
    const b = (await page.locator('.flip-book-host').boundingBox())!
    const y = b.y + b.height / 2
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.width - 20, y }] })
    for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: b.x + b.width - 20 - ((b.width - 40) * i) / 8, y }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect.poll(state).not.toBe(start)
  })
})

test('@movil ningún control queda cortado a lo ancho: inicio, asistente, editor simple y estudio', async ({ page }) => {
  await gotoHome(page)
  expect(await clippedControls(page), 'inicio vacío').toEqual([])
  await page.getByRole('button', { name: 'Nuevo proyecto' }).first().click()
  await expect(page.getByRole('button', { name: 'Crear rápido' })).toBeVisible()
  expect(await clippedControls(page), 'proyecto nuevo').toEqual([])
  await page.getByRole('button', { name: 'Crear rápido' }).click()
  await expect(page.locator('[data-ui-mode]')).toBeVisible()
  await page.waitForTimeout(500)
  for (const mode of ['simple', 'studio'] as const) {
    await page.evaluate(async (mode) => (await import(/* @vite-ignore */ '/src/store/ui.ts')).useUi.getState().setMode(mode), mode)
    await expect(page.locator(`[data-ui-mode=${mode}]`)).toBeVisible()
    await page.waitForTimeout(300)
    expect(await clippedControls(page), `editor ${mode}`).toEqual([])
  }
  await page.getByTitle('Volver a mis proyectos').first().click()
  await expect(page.getByRole('heading', { name: 'Tus proyectos' })).toBeVisible()
  expect(await clippedControls(page), 'inicio con proyecto').toEqual([])
})
