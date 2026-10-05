import { expect, test, type Page } from '@playwright/test'
import { clippedControls, createProjectInDb, gotoHome, inApp, openProject } from './helpers'

// Prompt 09 · Celular y tablet: barra inferior propia, hojas, selector de páginas, sidebar plegable,
// teclado en pantalla y sin scroll horizontal en 320, 375, 390, 768 y 1024 px.

const touch = { isMobile: true, hasTouch: true }
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)

async function open(page: Page, kind = 'comic') {
  await page.addInitScript(() => {
    localStorage.setItem('vineta:tour-done', '1')
    localStorage.setItem('vineta:ayudas-apagadas', '1')
  })
  await gotoHome(page)
  const id = await createProjectInDb(page, 'Móvil P09', kind, 3)
  await openProject(page, id)
  await inApp(page, `s.setPage(s.project.pages[1].id)`)
}

for (const width of [320, 375, 390]) {
  test.describe(`celular ${width} px`, () => {
    test.use({ viewport: { width, height: 760 }, ...touch })

    test('barra inferior: Agregar, Texto, Globo, Imagen, Viñeta y Más; sin scroll horizontal ni controles cortados', async ({ page }) => {
      await open(page)
      await expect(page.locator('[data-ui-mode]')).toHaveAttribute('data-ui-mode', 'simple')
      const bar = page.getByRole('navigation', { name: 'Herramientas' })
      for (const name of ['Agregar contenido', 'Texto', 'Globo', 'Imagen', 'Viñeta', 'Más herramientas']) {
        const b = bar.getByRole('button', { name, exact: true })
        await expect(b).toBeVisible()
        const box = (await b.boundingBox())!
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
      expect(await overflow(page)).toBeLessThanOrEqual(0)
      expect(await clippedControls(page)).toEqual([])

      // Globo: hoja de globos → insertar y escribir.
      await bar.getByRole('button', { name: 'Globo', exact: true }).tap()
      await page.getByRole('dialog', { name: 'Globos' }).getByRole('button', { name: 'Grito', exact: true }).tap()
      await expect(page.locator('textarea')).toBeFocused()
      await page.keyboard.type('¡Ey!')
      await page.keyboard.press('Enter')
      expect(await inApp<string>(page, `return m.store.findEl(s.selection[0]).text`)).toBe('¡Ey!')
      // Seleccionado: barra de acciones y "Más" abre las propiedades en una hoja.
      await page.getByRole('toolbar', { name: 'Acciones de lo seleccionado' }).getByRole('button', { name: 'Más' }).tap()
      await expect(page.getByRole('dialog', { name: 'Todas las opciones' })).toBeVisible()
      expect(await overflow(page)).toBeLessThanOrEqual(0)
    })
  })
}

test.describe('celular 390 px · flujo', () => {
  test.use({ viewport: { width: 390, height: 844 }, ...touch })

  test('selector de páginas, Viñeta (plantillas y a mano), Imagen sobre la viñeta y Más', async ({ page }) => {
    await open(page)
    const sw = page.getByTestId('selector-pagina')
    await expect(sw).toContainText('Pág. 2 / 3')
    await sw.getByRole('button', { name: 'Siguiente' }).tap()
    await expect(sw).toContainText('Pág. 3 / 3')
    await sw.getByRole('button', { name: 'Anterior' }).tap()
    await sw.getByRole('button', { name: /^Páginas:/ }).tap()
    await expect(page.getByRole('dialog', { name: 'Páginas' })).toBeVisible()
    await page.getByRole('dialog', { name: 'Páginas' }).getByRole('button', { name: 'Cerrar' }).tap()

    const bar = page.getByRole('navigation', { name: 'Herramientas' })
    await bar.getByRole('button', { name: 'Viñeta', exact: true }).tap()
    const sheet = page.getByRole('dialog', { name: 'Viñetas y plantillas' })
    await expect(sheet.getByRole('button', { name: /Dibujar viñeta a mano/ })).toBeVisible()
    await sheet.locator('[data-template="grid-2x2"]').tap()
    await page.getByRole('dialog', { name: 'Reemplazar viñetas' }).getByRole('button', { name: 'Aplicar' }).tap()
    await expect.poll(() => inApp<number>(page, `return m.store.currentPage().elements.filter((e) => e.type === 'panel').length`)).toBe(4)

    await inApp(page, `s.select([m.store.currentPage().elements.find((e) => e.type === 'panel').id])`)
    await bar.getByRole('button', { name: 'Imagen', exact: true }).tap()
    await expect(page.getByRole('dialog', { name: 'Imagen para la viñeta' })).toBeVisible()
    await page.getByRole('dialog', { name: 'Imagen para la viñeta' }).getByRole('button', { name: 'Cerrar' }).tap()
    await inApp(page, `s.select([])`)
    await bar.getByRole('button', { name: 'Imagen', exact: true }).tap()
    await expect(page.getByRole('dialog', { name: 'Agregar imagen' })).toBeVisible()
    await page.getByRole('dialog', { name: 'Agregar imagen' }).getByRole('button', { name: 'Cerrar' }).tap()

    await bar.getByRole('button', { name: 'Más herramientas' }).tap()
    const more = page.getByRole('dialog', { name: 'Más herramientas' })
    for (const n of ['Páginas', 'Imágenes', 'Formas y efectos', 'Capas', 'Guion']) await expect(more.getByRole('button', { name: new RegExp(`^${n}`) })).toBeVisible()
    await more.getByRole('button', { name: /^Formas y efectos/ }).tap()
    await expect(page.getByRole('dialog', { name: 'Formas, efectos y dibujo' })).toBeVisible()
  })

  test('teclado en pantalla: el texto que se edita queda a la vista cuando se achica la pantalla', async ({ page }) => {
    await open(page)
    const id = await inApp<string>(page, `const pg = m.store.currentPage(); const H = s.project.format.height; const t = m.factories.createText(100, H - 260, m.factories.TEXT_PRESETS[4]); t.height = 120; m.store.useEditor.getState().addElements([t]); return t.id`)
    await inApp(page, `s.setEditingText(arg)`, id)
    await expect(page.locator('textarea')).toBeFocused()
    // Simula el teclado: la parte visible pasa a ser 420 px de alto.
    await page.setViewportSize({ width: 390, height: 420 })
    await expect
      .poll(() =>
        page.evaluate(() => {
          const t = document.querySelector('textarea')!.getBoundingClientRect()
          return t.bottom <= window.innerHeight && t.top >= 0
        }),
      )
      .toBe(true)
  })
})

test.describe('tablet 768 px', () => {
  test.use({ viewport: { width: 768, height: 1024 }, ...touch })

  test('híbrido: estudio con sidebar plegada (se abre desde la barra), lienzo grande y propiedades temporales', async ({ page }) => {
    await open(page)
    await expect(page.locator('[data-ui-mode]')).toHaveAttribute('data-ui-mode', 'studio')
    await expect(page.getByRole('complementary', { name: 'Paneles del proyecto' })).toHaveCount(0)
    const canvasW = await page.locator('[data-tour=canvas]').evaluate((e) => e.getBoundingClientRect().width)
    expect(canvasW).toBeGreaterThan(650)
    expect(await overflow(page)).toBeLessThanOrEqual(0)

    await page.getByRole('button', { name: 'Mostrar paneles' }).tap()
    await expect(page.getByRole('complementary', { name: 'Paneles del proyecto' })).toBeVisible()
    expect(await overflow(page)).toBeLessThanOrEqual(0)
    await page.getByRole('button', { name: 'Ocultar paneles' }).tap()
    await expect(page.getByRole('complementary', { name: 'Paneles del proyecto' })).toHaveCount(0)

    // Panel contextual temporal (hoja "Ajustes").
    await inApp(page, `s.select([m.store.currentPage().elements[0].id])`)
    await page.getByRole('navigation', { name: 'Paneles' }).getByRole('button', { name: 'Ajustes' }).tap()
    await expect(page.getByRole('dialog', { name: 'Propiedades' })).toBeVisible()
    expect(await clippedControls(page)).toEqual([])
  })
})

test.describe('escritorio chico 1024 px', () => {
  test.use({ viewport: { width: 1024, height: 768 } })

  test('sidebar abierta por defecto, sin scroll horizontal', async ({ page }) => {
    await open(page)
    await expect(page.getByRole('complementary', { name: 'Paneles del proyecto' })).toBeVisible()
    expect(await overflow(page)).toBeLessThanOrEqual(0)
    expect(await clippedControls(page)).toEqual([])
  })
})
