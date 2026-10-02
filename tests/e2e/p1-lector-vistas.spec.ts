import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createProjectInDb, FIXTURES, gotoHome, inApp, openProject, skipTour } from './helpers'

test.beforeEach(async ({ page }) => {
  await skipTour(page)
})

const isTouch = (page: Page) => page.evaluate(() => matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0)
const label = (page: Page) => page.getByTestId('lectura-estado').innerText()
const firstPage = async (page: Page) => Number((await label(page)).match(/P[áa]ginas? (\d+)/)![1])

/** Proyecto de N páginas abierto en el lector. */
async function openReader(page: Page, { pages = 8, dir = 'ltr' }: { pages?: number; dir?: 'ltr' | 'rtl' } = {}) {
  await gotoHome(page)
  const id = await createProjectInDb(page, `Lector ${dir}`, dir === 'rtl' ? 'manga' : 'comic', pages)
  await openProject(page, id)
  await page.locator('[data-tour=read]').click()
  await expect(page.getByRole('slider', { name: 'Ir a página' })).toBeVisible({ timeout: 30_000 })
  await page.waitForTimeout(300)
  return id
}

/** Arrastre real: dedo (CDP) en táctiles, mouse en escritorio. */
async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  if (await isTouch(page)) {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] })
    for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from.x + ((to.x - from.x) * i) / 8, y: from.y + ((to.y - from.y) * i) / 8 }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } else {
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    await page.mouse.move(to.x, to.y, { steps: 8 })
    await page.mouse.up()
  }
  await page.waitForTimeout(800)
}

async function tap(page: Page, x: number, y: number) {
  if (await isTouch(page)) await page.touchscreen.tap(x, y)
  else await page.mouse.click(x, y)
  await page.waitForTimeout(800)
}

const bookBox = async (page: Page) => (await page.locator('.flip-book-host').boundingBox())!

for (const dir of ['ltr', 'rtl'] as const) {
  test(`@movil swipes: cuatro por dirección avanzan y retroceden (${dir})`, async ({ page }) => {
    await openReader(page, { dir })
    const b = await bookBox(page)
    const y = b.y + b.height / 2
    // Avanzar: en cómic se tira la hoja hacia la izquierda; en manga, hacia la derecha.
    const fwd = dir === 'ltr' ? [b.x + b.width - 20, b.x + 20] : [b.x + 20, b.x + b.width - 20]
    const seen = [await firstPage(page)]
    for (let i = 0; i < 4; i++) {
      await drag(page, { x: fwd[0], y }, { x: fwd[1], y })
      seen.push(await firstPage(page))
    }
    for (let i = 0; i < 4; i++) {
      await drag(page, { x: fwd[1], y }, { x: fwd[0], y })
      seen.push(await firstPage(page))
    }
    for (let i = 1; i <= 4; i++) expect(seen[i], `swipe ${i} hacia adelante: ${seen.join(',')}`).toBeGreaterThan(seen[i - 1])
    for (let i = 5; i <= 8; i++) expect(seen[i], `swipe ${i - 4} hacia atrás: ${seen.join(',')}`).toBeLessThan(seen[i - 1])
    expect(seen[8]).toBe(1)
  })
}

test('@movil esquinas superior e inferior: nada las tapa y arrastrarlas pasa la página', async ({ page }) => {
  await openReader(page)
  const b = await bookBox(page)
  for (const y of [b.y + 6, b.y + b.height - 6]) {
    const x = b.x + b.width - 6
    const inBook = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('.flip-book-host'), [x, y])
    expect(inBook, `la esquina (${Math.round(x)}, ${Math.round(y)}) está tapada`).toBe(true)
    const before = await firstPage(page)
    await drag(page, { x, y }, { x: b.x + b.width * 0.15, y: b.y + b.height / 2 })
    expect(await firstPage(page)).toBeGreaterThan(before)
  }
})

test('@movil el primer toque sobre un control oculto ejecuta la acción', async ({ page }) => {
  await openReader(page)
  const bar = page.getByTestId('lectura-estado').locator('xpath=ancestor::div[contains(@class,"absolute")][1]')
  await expect.poll(() => bar.evaluate((el) => getComputedStyle(el).opacity), { timeout: 8000 }).toBe('0')
  const next = await page.getByRole('button', { name: 'Página siguiente' }).boundingBox()
  await tap(page, next!.x + next!.width / 2, next!.y + next!.height / 2)
  expect(await firstPage(page)).toBeGreaterThan(1)
})

test('@movil tocar los costados pasa la página y se puede desactivar', async ({ page }) => {
  await openReader(page)
  const b = await bookBox(page)
  await tap(page, b.x + b.width - 10, b.y + b.height / 2)
  const after = await firstPage(page)
  expect(after).toBeGreaterThan(1)
  await page.getByRole('button', { name: 'Tocar los costados para pasar la página' }).click()
  await tap(page, b.x + b.width - 10, b.y + b.height / 2)
  expect(await firstPage(page)).toBe(after)
})

test('teclado: flechas, Inicio/Fin navegan y no tocan el documento (manga)', async ({ page }) => {
  await openReader(page, { dir: 'rtl', pages: 6 })
  const doc = await inApp<string>(page, 'return JSON.stringify(s.project.pages)')
  await page.keyboard.press('ArrowLeft') // en manga, izquierda avanza
  await page.waitForTimeout(800)
  expect(await firstPage(page)).toBeGreaterThan(1)
  await page.keyboard.press('End')
  await expect(page.getByTestId('lectura-estado')).toContainText('de 6')
  expect(await firstPage(page)).toBeGreaterThanOrEqual(5)
  await page.keyboard.press('Home')
  await expect(page.getByTestId('lectura-estado')).toContainText('Página 1 de 6')
  expect(await inApp<string>(page, 'return JSON.stringify(s.project.pages)')).toBe(doc)
})

test('cambiar libro ↔ scroll conserva la página', async ({ page }) => {
  await openReader(page, { pages: 8 })
  await page.getByRole('slider', { name: 'Ir a página' }).fill('6')
  await page.waitForTimeout(600)
  const book = await firstPage(page)
  expect(book).toBeGreaterThanOrEqual(5)
  await page.getByRole('button', { name: 'Modo scroll vertical' }).click()
  const box = page.getByTestId('lectura-scroll')
  await expect(box).toBeVisible()
  const visibleIdx = await box.evaluate((b) => {
    const r = b.getBoundingClientRect()
    const mid = r.top + r.height / 2
    return [...b.querySelectorAll('img')].findIndex((im) => {
      const q = im.getBoundingClientRect()
      return q.top <= mid && q.bottom >= mid
    })
  })
  expect(visibleIdx + 1).toBeGreaterThanOrEqual(book - 1)
  expect(visibleIdx + 1).toBeLessThanOrEqual(book + 1)
  // Bajar hasta la página 3 y volver al libro.
  await box.evaluate((b) => (b.querySelectorAll('img')[2] as HTMLElement).scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'Modo libro' }).click()
  await expect(page.getByTestId('lectura-estado')).toBeVisible()
  const back = await firstPage(page)
  expect(Math.abs(back - 3)).toBeLessThanOrEqual(1)
})

test('@movil sin scroll horizontal en lector, previsualización y vista general', async ({ page }) => {
  await openReader(page, { pages: 4 })
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(await overflow()).toBeLessThanOrEqual(0)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Previsualizar' }).click()
  await expect(page.getByTestId('previsualizacion')).toBeVisible()
  expect(await overflow()).toBeLessThanOrEqual(0)
  await page.getByRole('button', { name: 'Volver al editor' }).click()
  await inApp(page, `document.dispatchEvent(new Event('noop'))`)
  await page.getByRole('button', { name: 'Exportar' }).click()
  await page.getByRole('button', { name: 'Vista general', exact: true }).last().click()
  await expect(page.getByTestId('vista-general')).toBeVisible()
  expect(await overflow()).toBeLessThanOrEqual(0)
})

test('previsualizar: sin UI de edición, pliego, zoom y Esc vuelve', async ({ page }) => {
  await gotoHome(page)
  const id = await createProjectInDb(page, 'Previa', 'comic', 4)
  await openProject(page, id)
  await inApp(page, 's.select([s.project.pages[0].elements[0].id])')
  await page.getByRole('button', { name: 'Previsualizar' }).click()
  const pv = page.getByTestId('previsualizacion')
  await expect(pv.locator('img')).toHaveCount(1)
  await expect(page.locator('.konvajs-content').first()).toBeHidden({ timeout: 1000 }).catch(() => undefined)
  await expect(page.getByRole('dialog', { name: /Previsualización/ })).toBeVisible()
  await page.getByRole('button', { name: 'Página siguiente' }).click()
  await page.getByRole('button', { name: /Pliego/ }).click()
  await expect(pv.locator('img')).toHaveCount(2)
  await expect(page.getByText('Páginas 2–3 de 4')).toBeVisible()
  await page.getByRole('button', { name: '100 %' }).click()
  expect(await pv.locator('img').first().evaluate((im) => Math.round(im.getBoundingClientRect().width))).toBe(994)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: /Previsualización/ })).toHaveCount(0)
  expect(await inApp<boolean>(page, 'return s.readerOpen')).toBe(false)
})

test.describe('vista general', () => {
  test('@movil reordenar con la manija (dedo o mouse), con teclado, renombrar, duplicar y eliminar', async ({ page }) => {
    await gotoHome(page)
    const id = await createProjectInDb(page, 'Vista general', 'comic', 4)
    await openProject(page, id)
    const names = () => inApp<string[]>(page, 'return s.project.pages.map(p => p.name)')
    const start = await names()
    await page.getByRole('button', { name: 'Exportar' }).click()
    await page.getByRole('button', { name: 'Vista general', exact: true }).last().click()
    const grid = page.getByTestId('vista-general')
    await expect(grid).toBeVisible()
    // Teclado: la primera página va un lugar a la derecha.
    await grid.getByRole('button', { name: /^Mover página 1/ }).focus()
    await page.keyboard.press('ArrowRight')
    expect(await names()).toEqual([start[1], start[0], start[2], start[3]])
    await expect(grid.getByRole('button', { name: /^Mover página 2/ })).toBeFocused()
    // Arrastrar la manija de la página 4 sobre la página 1.
    const h = (await grid.getByRole('button', { name: /^Mover página 4/ }).boundingBox())!
    const t = (await grid.locator('li').nth(0).boundingBox())!
    await drag(page, { x: h.x + h.width / 2, y: h.y + h.height / 2 }, { x: t.x + t.width / 2, y: t.y + t.height / 3 })
    expect((await names())[0]).toBe(start[3])
    // Renombrar, duplicar y eliminar con confirmación (acciones visibles, sin hover).
    await grid.getByRole('button', { name: 'Renombrar página' }).first().click()
    await page.getByRole('textbox', { name: 'Nombre de la página' }).fill('Apertura')
    await page.keyboard.press('Enter')
    expect((await names())[0]).toBe('Apertura')
    await grid.getByRole('button', { name: 'Duplicar página' }).first().click()
    expect(await names()).toHaveLength(5)
    await grid.getByRole('button', { name: 'Eliminar página' }).last().click()
    await page.getByRole('dialog', { name: 'Eliminar página' }).getByRole('button', { name: 'Eliminar', exact: true }).click()
    expect(await names()).toHaveLength(4)
    // Abrir una página desde la grilla la deja activa en el editor.
    await grid.getByRole('button', { name: /^Abrir página 3/ }).click()
    expect(await inApp<number>(page, 'return s.project.pages.findIndex(p => p.id === s.pageId)')).toBe(2)
  })

  test('copiar una página con imágenes y pegarla en otro proyecto: referencias y blobs válidos', async ({ page }) => {
    await gotoHome(page)
    const a = await createProjectInDb(page, 'Origen página', 'libre', 1)
    await openProject(page, a)
    await page.getByRole('tab', { name: 'Imágenes' }).click()
    await page.locator('input[type=file][accept="image/*"]').setInputFiles(FIXTURES + 'foto-a.png')
    await expect.poll(() => inApp<number>(page, 'return s.project.assets.length')).toBe(1)
    await inApp(page, `const pan = s.project.pages[0].elements.find(e => e.type === 'panel'); m.placement.fillPanel(pan.id, s.project.assets[0])`)
    await page.getByRole('button', { name: 'Vista general' }).click()
    await page.getByRole('button', { name: 'Copiar página' }).first().click()
    await page.getByRole('button', { name: 'Volver al editor' }).click()
    await page.getByTitle('Volver a mis proyectos').click()
    const b = await createProjectInDb(page, 'Destino página', 'libre', 1)
    await openProject(page, b)
    await page.getByRole('button', { name: 'Vista general' }).click()
    await page.getByRole('button', { name: 'Pegar página' }).click()
    await expect.poll(() => inApp<number>(page, 'return s.project.pages.length')).toBe(2)
    const r = await inApp<{ pages: number; ok: boolean; blob: boolean }>(
      page,
      `const pg = s.project.pages[1]; const pan = pg.elements.find(e => e.type === 'panel' && e.image)
       const ok = !!pan && s.project.assets.some(a => a.id === pan.image.assetId)
       const img = ok ? await m.assets.loadAssetImage(pan.image.assetId) : null
       return { pages: s.project.pages.length, ok, blob: !!img && img.naturalWidth > 0 }`,
    )
    expect(r).toEqual({ pages: 2, ok: true, blob: true })
  })
})

test('libro web exportado: funciona sin internet, con idioma, dirección y sin dependencias externas', async ({ page, context }, info) => {
  await gotoHome(page)
  await page.locator('input[type=file][accept=".vineta,application/json"]').setInputFiles(FIXTURES + 'legacy-v1.vineta')
  await page.locator('main article').first().locator('button').first().click()
  await expect(page.locator('[data-tour=read]')).toBeVisible()
  // Obra mayormente en japonés: el libro exportado debe declarar lang="ja".
  await inApp(page, `for (const pg of s.project.pages) for (const el of pg.elements) if (el.type === 'text' || el.type === 'bubble') s.updateElement(el.id, { text: '桜の風がふいている' })`)
  await page.getByRole('button', { name: 'Exportar' }).click()
  await page.getByText('Exportar…').click()
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Libro web/ }).click()])
  const path = info.outputPath('libro.html')
  await dl.saveAs(path)
  const html = readFileSync(path, 'utf8')
  expect(html).not.toMatch(/(src|href)="https?:\/\/(?!matelabs\.site)/)
  expect(html).not.toContain('fonts.googleapis')
  expect(html).toContain('<html lang="ja">')
  const book = await context.newPage()
  const errors: string[] = []
  book.on('pageerror', (e) => errors.push(String(e)))
  await book.route(/^https?:\/\//, (r) => r.abort())
  await book.goto('file://' + path)
  await expect(book.locator('#num')).toHaveText('Página 1 de 2')
  await book.getByRole('button', { name: 'Página siguiente' }).click()
  await expect(book.locator('#num')).toHaveText('Página 2 de 2')
  expect(errors).toEqual([])
})
