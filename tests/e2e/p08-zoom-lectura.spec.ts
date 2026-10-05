import { expect, test, type Page } from '@playwright/test'
import { canvasPoint, createProjectInDb, gotoHome, inApp, openProject, openView, skipTour } from './helpers'

// Prompt 08 · Zoom, desplazamiento y modo lectura.

test.beforeEach(async ({ page }) => {
  await skipTour(page)
  await gotoHome(page)
})

const view = (page: Page) =>
  page.evaluate(async () => {
    const path = '/src/store/editor.ts'
    const m = await import(/* @vite-ignore */ path)
    const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => /\/konva\.js/.test(n))!
    const Konva = (await import(/* @vite-ignore */ url)).default
    const st = [...Konva.stages].find((x) => document.querySelector('[data-tour=canvas]')!.contains(x.container()))
    const s = m.useEditor.getState()
    return { zoom: s.zoom, x: st.x(), y: st.y(), w: st.width(), h: st.height(), pw: s.project.format.width, ph: s.project.format.height, revision: s.revision }
  })

test('menú de zoom: ajustar página, ajustar ancho, 100 % y niveles; el zoom no toca el documento', async ({ page }) => {
  const id = await createProjectInDb(page, 'Zoom', 'comic', 3)
  await openProject(page, id)
  const doc = () => inApp<string>(page, `return JSON.stringify(s.project.pages) + '|' + s.past.length`)
  const doc0 = await doc()
  const zoomBtn = page.getByRole('button', { name: /^Zoom \d+ %$/ })

  await zoomBtn.click()
  await page.getByRole('button', { name: /Ajustar ancho/ }).click()
  let v = await view(page)
  expect(v.zoom * v.pw).toBeGreaterThan(v.w - 130)
  expect(v.zoom * v.pw).toBeLessThanOrEqual(v.w)
  expect(v.y).toBeLessThan(40) // se ve desde arriba

  await zoomBtn.click()
  await page.getByRole('button', { name: /Ajustar página/ }).click()
  v = await view(page)
  expect(v.zoom * v.ph).toBeLessThanOrEqual(v.h)
  expect(v.zoom * v.pw).toBeLessThanOrEqual(v.w)

  await zoomBtn.click()
  await page.getByRole('button', { name: /Tamaño real/ }).click()
  expect((await view(page)).zoom).toBe(1)
  await zoomBtn.click()
  await page.getByRole('group', { name: 'Zoom' }).getByRole('button', { name: '50%', exact: true }).click()
  expect((await view(page)).zoom).toBe(0.5)

  // Atajos.
  await page.keyboard.press('Control+2')
  expect((await view(page)).zoom).toBeGreaterThan(0.5)
  await page.keyboard.press('Control+1')
  expect((await view(page)).zoom).toBe(1)
  await page.keyboard.press('Control+0')
  expect((await view(page)).zoom).toBeLessThan(1)

  // (La miniatura de portada puede guardarse sola; las páginas y el historial no cambian.)
  expect(await doc()).toBe(doc0)
})

test('Ctrl+rueda acerca al puntero y Espacio+arrastrar mueve el lienzo sin mover nada de la página', async ({ page }) => {
  const id = await createProjectInDb(page, 'Pan', 'comic', 2)
  await openProject(page, id)
  const before = await view(page)
  const center = await canvasPoint(page, { x: before.pw / 2, y: before.ph / 2 })
  await page.mouse.move(center.x, center.y)
  await page.keyboard.down('Control')
  await page.mouse.wheel(0, -300)
  await page.keyboard.up('Control')
  const zoomed = await view(page)
  expect(zoomed.zoom).toBeGreaterThan(before.zoom)

  const els0 = await inApp<string>(page, `return JSON.stringify(m.store.currentPage().elements)`)
  await page.keyboard.down('Space')
  await page.mouse.down()
  await page.mouse.move(center.x + 120, center.y + 60, { steps: 6 })
  await page.mouse.up()
  await page.keyboard.up('Space')
  const panned = await view(page)
  expect(panned.x - zoomed.x).toBeCloseTo(120, -1)
  expect(await inApp<string>(page, `return JSON.stringify(m.store.currentPage().elements)`)).toBe(els0)
})

test('modo lectura: sin UI de edición, respeta el orden (también manga), teclado y al salir conserva el estado', async ({ page }) => {
  const id = await createProjectInDb(page, 'Lectura', 'manga', 4)
  await openProject(page, id)
  await inApp(page, `s.setPage(s.project.pages[1].id)`)
  const panel = await inApp<string>(page, `const p = m.store.currentPage().elements.find((e) => e.type === 'panel'); m.store.useEditor.getState().select([p.id]); m.store.useEditor.getState().setZoom(0.8); return p.id`)
  await openView(page, 'Previsualizar')
  const dialog = page.getByRole('dialog', { name: /Previsualización/ })
  await expect(dialog).toBeVisible()
  await expect(page.getByText('Página 2 de 4')).toBeVisible()
  // Sin sidebars ni panel de propiedades accesibles: el editor queda inerte detrás.
  await expect(page.getByRole('complementary', { name: 'Propiedades' })).toHaveAttribute('aria-label', 'Propiedades')
  expect(await page.evaluate(() => !!document.querySelector('[inert] [aria-label="Propiedades"]'))).toBe(true)
  // Manga (der → izq): la flecha izquierda avanza.
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByText('Página 3 de 4')).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByText('Página 2 de 4')).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Pantalla completa' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  expect(await inApp<{ page: number; sel: string[]; zoom: number }>(page, `return { page: s.project.pages.findIndex((p) => p.id === s.pageId), sel: s.selection, zoom: s.zoom }`)).toEqual({ page: 1, sel: [panel], zoom: 0.8 })
})

test('webtoon: la previsualización arranca en lectura vertical continua (teléfono) y ofrece scroll', async ({ page }) => {
  const id = await createProjectInDb(page, 'Webtoon', 'webtoon', 3)
  await openProject(page, id)
  await openView(page, 'Previsualizar')
  const dialog = page.getByRole('dialog', { name: /Previsualización/ })
  await expect(dialog.getByRole('button', { name: /Teléfono/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(dialog.getByTestId('pantalla-telefono').locator('img')).toHaveCount(3, { timeout: 20_000 })
  await dialog.getByRole('button', { name: /Scroll/ }).click()
  await expect(dialog.getByTestId('previsualizacion').locator('img')).toHaveCount(3)
})
