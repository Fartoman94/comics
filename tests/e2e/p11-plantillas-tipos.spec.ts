import { expect, test, type Page } from '@playwright/test'
import { createProjectInDb, gotoHome, inApp, openProject, skipTour } from './helpers'

// Prompt 11 · "¿Qué querés crear?", plantillas iniciales con vista previa, confirmación con
// "en página nueva", plantillas separadas de Diseño y conservación de recursos e historial.

test.beforeEach(async ({ page }) => {
  await skipTour(page)
  await gotoHome(page)
})

test('"¿Qué querés crear?": cómic, manga, webtoon, storyboard y tira cómica con su exportación recomendada', async ({ page }) => {
  await page.getByRole('button', { name: 'Nuevo proyecto' }).first().click()
  await expect(page.getByRole('heading', { name: '¿Qué querés crear?' })).toBeVisible()
  const kinds = page.getByRole('radiogroup', { name: 'Tipo de obra' })
  for (const n of ['Cómic', 'Manga', 'Webtoon', 'Storyboard', 'Tira cómica']) await expect(kinds.getByRole('radio', { name: new RegExp(`^${n}`) })).toBeVisible()
  await expect(kinds.getByRole('radio', { name: /^Manga/ })).toContainText('der → izq')
  await expect(kinds.getByRole('radio', { name: /^Webtoon/ })).toContainText('Exportar: Webtoon en segmentos JPG')
  await kinds.getByRole('radio', { name: /^Storyboard/ }).click()
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await page.getByRole('radio', { name: /Con plantilla/ }).click()
  await expect(page.getByRole('radiogroup', { name: 'Plantilla' }).getByRole('radio').first()).toContainText('sugerida')
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await page.getByRole('button', { name: 'Crear proyecto' }).click()
  await expect(page.locator('[data-ui-mode]')).toBeVisible()
  const info = await inApp<{ format: string; w: number; h: number; panels: number[] }>(page, `return { format: s.project.format.id, w: s.project.format.width, h: s.project.format.height, panels: s.project.pages.map((p) => p.elements.filter((e) => e.type === 'panel').length) }`)
  expect(info.format).toBe('storyboard')
  expect(info.w).toBeGreaterThan(info.h)
  expect(info.panels.slice(1).every((n) => n === 6)).toBe(true)
  // La exportación arranca con la recomendada para el tipo.
  await page.getByRole('button', { name: /Exportar/ }).first().click()
  await page.getByText('Exportar…').click()
  await expect(page.getByRole('radio', { name: /Pantalla \(PDF liviano\)/ })).toHaveAttribute('aria-checked', 'true')
})

async function openWithContent(page: Page) {
  const id = await createProjectInDb(page, 'Plantillas P11', 'comic', 2)
  await openProject(page, id)
  await inApp(
    page,
    `s.addAsset({ id: 'as_p11', name: 'fondo', width: 10, height: 10, mime: 'image/png', createdAt: 0 });
     const pg = s.project.pages[1]; s.setPage(pg.id);
     const b = m.factories.createBubble('speech', 100, 100); m.store.useEditor.getState().addElements([b], { select: false })`,
  )
  await page.getByRole('tab', { name: 'Plantillas' }).click()
}

test('plantillas iniciales: nombre, explicación y cantidad visibles; con contenido ofrece "En página nueva"', async ({ page }) => {
  await openWithContent(page)
  const panel = page.getByRole('complementary', { name: 'Paneles del proyecto' })
  const starter = panel.locator('[data-starter="manga-dynamic"]')
  await expect(starter).toContainText('Manga')
  await expect(starter).toContainText('5 viñetas')
  await expect(starter).toContainText('derecha a izquierda')
  // Vista previa en la galería al pasar el puntero.
  await panel.locator('[data-template="hero-top"]').hover()
  await expect(panel.getByTestId('detalle-plantilla')).toContainText('Destacada arriba · 4 viñetas')

  const before = await inApp<{ pages: number; page1: string }>(page, `return { pages: s.project.pages.length, page1: JSON.stringify(s.project.pages[1].elements) }`)
  await starter.click()
  const dialog = page.getByRole('dialog', { name: 'Reemplazar viñetas' })
  await expect(dialog.getByRole('button', { name: 'En página nueva' })).toBeVisible()
  await dialog.getByRole('button', { name: 'En página nueva' }).click()
  const after = await inApp<{ pages: number; page1: string; current: number; panels: number }>(page, `return { pages: s.project.pages.length, page1: JSON.stringify(s.project.pages[1].elements), current: s.project.pages.findIndex((p) => p.id === s.pageId), panels: m.store.currentPage().elements.filter((e) => e.type === 'panel').length }`)
  expect(after.pages).toBe(before.pages + 1)
  expect(after.page1).toBe(before.page1)
  expect(after.current).toBe(2)
  expect(after.panels).toBe(5)

  // Reemplazar en la página 2: se conservan los recursos y el globo; deshacer vuelve atrás.
  await inApp(page, `s.setPage(s.project.pages[1].id)`)
  await panel.locator('[data-starter="splash"]').click()
  await page.getByRole('dialog', { name: 'Reemplazar viñetas' }).getByRole('button', { name: 'Aplicar' }).click()
  expect(await inApp<number>(page, `return m.store.currentPage().elements.filter((e) => e.type === 'panel').length`)).toBe(1)
  expect(await inApp<number>(page, `return m.store.currentPage().elements.filter((e) => e.type === 'bubble').length`)).toBe(1)
  expect(await inApp<string[]>(page, `return s.project.assets.map((a) => a.id)`)).toContain('as_p11')
  await page.keyboard.press('Control+z')
  expect(await inApp<string>(page, `return JSON.stringify(s.project.pages[1].elements)`)).toBe(before.page1)

  // Página libre: quita las viñetas (con confirmación).
  await panel.locator('[data-starter="libre"]').click()
  await page.getByRole('dialog', { name: 'Página libre' }).getByRole('button', { name: 'Quitar viñetas' }).click()
  expect(await inApp<number>(page, `return m.store.currentPage().elements.filter((e) => e.type === 'panel').length`)).toBe(0)
  expect(await inApp<number>(page, `return m.store.currentPage().elements.filter((e) => e.type === 'bubble').length`)).toBe(1)
})

test('Diseño (estilos) separado de Plantillas: bordes a la página o al proyecto y tipografía de globos', async ({ page }) => {
  await openWithContent(page)
  await inApp(page, `s.select([])`)
  const inspector = page.getByRole('complementary', { name: 'Propiedades' })
  const design = inspector.getByRole('group', { name: 'Bordes de viñetas' })
  await design.getByRole('slider', { name: 'Grosor' }).fill('14')
  await design.getByRole('button', { name: 'A esta página' }).click()
  const widths = () => inApp<number[][]>(page, `return s.project.pages.map((p) => p.elements.filter((e) => e.type === 'panel').map((e) => e.strokeWidth))`)
  let w = await widths()
  expect(w[1].every((v) => v === 14)).toBe(true)
  expect(w[0].every((v) => v !== 14)).toBe(true)
  await design.getByRole('button', { name: 'A todo el proyecto' }).click()
  w = await widths()
  expect(w.flat().every((v) => v === 14)).toBe(true)
  const fonts = inspector.getByRole('group', { name: 'Tipografía de globos' })
  await fonts.getByRole('combobox', { name: 'Fuente de los globos' }).selectOption('Bangers')
  await fonts.getByRole('button', { name: 'A esta página' }).click()
  expect(await inApp<string[]>(page, `return m.store.currentPage().elements.filter((e) => e.type === 'bubble').map((e) => e.fontFamily)`)).toEqual(['Bangers'])
  // Las plantillas no aparecen en Diseño ni Diseño en Plantillas.
  await expect(page.getByRole('complementary', { name: 'Paneles del proyecto' }).getByRole('group', { name: 'Bordes de viñetas' })).toHaveCount(0)
})
